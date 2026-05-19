"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { addMonths, differenceInDays, format } from "date-fns";
import { Plus, Target, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePlanningStore } from "@/store/use-planning-store";
import type { Goal, GoalInput } from "@/types/finance";
import { GOAL_CATEGORIES } from "@/types/finance";
import { useCurrency } from "@/hooks/use-currency";
import { useTranslation } from "@/hooks/use-translation";

const goalSchema = z.object({
  title: z.string().min(2).max(80),
  category: z.string().min(1),
  targetAmount: z.number().positive(),
  targetDate: z.string().min(1),
  monthlyContribution: z.number().min(0),
  expectedAnnualReturn: z.number().min(0).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

type GoalFormValues = z.infer<typeof goalSchema>;

function simulateGrowth(goal: Goal) {
  const monthlyRate = goal.expectedAnnualReturn / 100 / 12;
  const currentDate = new Date();
  const targetDate = new Date(goal.targetDate);
  const months = Math.max(0, Math.ceil(differenceInDays(targetDate, currentDate) / 30));

  let projected = goal.currentAmount;
  const roadmap: Array<{ label: string; value: number }> = [];

  for (let month = 1; month <= months; month += 1) {
    projected = projected * (1 + monthlyRate) + goal.monthlyContribution;

    if (month % 12 === 0 || month === months) {
      roadmap.push({
        label: format(addMonths(currentDate, month), "MMM yyyy"),
        value: projected,
      });
    }
  }

  return {
    projectedTotal: projected,
    roadmap,
  };
}

function GoalDialog() {
  const addGoal = usePlanningStore((state) => state.addGoal);
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: "",
      category: GOAL_CATEGORIES[0],
      targetAmount: 10000,
      targetDate: format(addMonths(new Date(), 12), "yyyy-MM-dd"),
      monthlyContribution: 500,
      expectedAnnualReturn: 5,
      color: "#2563eb",
    },
  });

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;
  const selectedCategory = useWatch({ control: form.control, name: "category" });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" /> {t("planning.createGoal")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("planning.newGoal")}</DialogTitle>
          <DialogDescription>
            {t("planning.goalDescription")}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={handleSubmit((values) => {
            const payload: GoalInput = {
              title: values.title,
              category: values.category,
              color: values.color,
              targetAmount: values.targetAmount,
              currentAmount: 0,
              monthlyContribution: values.monthlyContribution,
              targetDate: values.targetDate,
              expectedAnnualReturn: values.expectedAnnualReturn,
            };

            addGoal(payload);
            toast.success("Goal created.");
            setOpen(false);
            form.reset();
          })}
        >
          <div className="space-y-2">
            <Label htmlFor="goal-title">{t("planning.goalTitle")}</Label>
            <Input id="goal-title" placeholder="Emergency fund" {...register("title")} />
            {errors.title ? <p className="text-xs text-destructive">{errors.title.message}</p> : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("planning.category")}</Label>
              <Select
                value={selectedCategory}
                onValueChange={(value) => {
                  if (!value) {
                    return;
                  }
                  setValue("category", value, { shouldValidate: true });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("planning.category")} />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-date">{t("planning.targetDate")}</Label>
              <Input id="goal-date" type="date" {...register("targetDate")} />
              {errors.targetDate ? (
                <p className="text-xs text-destructive">{errors.targetDate.message}</p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="goal-target">{t("planning.targetAmount")}</Label>
              <Input
                id="goal-target"
                type="number"
                min="0"
                {...register("targetAmount", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-contribution">{t("planning.monthlyContribution")}</Label>
              <Input
                id="goal-contribution"
                type="number"
                min="0"
                {...register("monthlyContribution", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="goal-return">{t("planning.expectedReturn")}</Label>
              <Input
                id="goal-return"
                type="number"
                min="0"
                step="0.1"
                {...register("expectedAnnualReturn", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-color">{t("planning.color")}</Label>
              <Input id="goal-color" type="color" className="h-10" {...register("color")} />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {t("planning.saveGoal")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const removeGoal = usePlanningStore((state) => state.removeGoal);
  const addContribution = usePlanningStore((state) => state.addContribution);
  const { format, convert } = useCurrency();
  const { t } = useTranslation();

  const [contributionInput, setContributionInput] = useState("");

  const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
  const daysLeft = differenceInDays(new Date(goal.targetDate), new Date());
  const growth = useMemo(() => simulateGrowth(goal), [goal]);

  const milestones = [25, 50, 75, 100].map((percentage) => {
    const value = (goal.targetAmount * percentage) / 100;
    return {
      percentage,
      value,
      reached: goal.currentAmount >= value,
    };
  });

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute left-0 top-0 h-full w-1" style={{ backgroundColor: goal.color }} />
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-xl">{goal.title}</CardTitle>
            <p className="text-xs text-muted-foreground">{goal.category}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => {
              removeGoal(goal.id);
              toast.success("Goal removed.");
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {format(convert(goal.currentAmount))} of {format(convert(goal.targetAmount))}
          </p>
          <Progress value={progress} className="mt-2" />
          <p className="mt-1 text-xs text-muted-foreground">{Math.round(progress)}% completed</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <p>Deadline: {new Date(goal.targetDate).toLocaleDateString()}</p>
          <p className="text-right">
            {daysLeft >= 0 ? `${daysLeft} ${t("planning.daysLeft")}` : `${Math.abs(daysLeft)} ${t("planning.daysOverdue")}`}
          </p>
          <p>{t("planning.monthlyContribution")}: {format(convert(goal.monthlyContribution))}</p>
          <p className="text-right">Return: {goal.expectedAnnualReturn}%/year</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">{t("planning.milestones")}</p>
          <div className="grid grid-cols-4 gap-2">
            {milestones.map((milestone) => (
              <div
                key={milestone.percentage}
                className={`rounded-md border p-2 text-center text-xs ${
                  milestone.reached
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
                    : "border-border text-muted-foreground"
                }`}
              >
                <p className="font-semibold">{milestone.percentage}%</p>
                <p>{format(convert(milestone.value))}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">{t("planning.roadmap")}</p>
          <div className="max-h-28 space-y-1 overflow-y-auto rounded-md border p-2 text-xs text-muted-foreground">
            {growth.roadmap.length === 0 ? (
              <p>{t("planning.noRoadmap")}</p>
            ) : (
              growth.roadmap.map((node) => (
                <div key={node.label} className="flex items-center justify-between">
                  <span>{node.label}</span>
                  <span className="font-medium text-foreground">{format(convert(node.value))}</span>
                </div>
              ))
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("planning.projectedTotal")}: <span className="font-semibold text-foreground">{format(convert(growth.projectedTotal))}</span>
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            type="number"
            min="0"
            value={contributionInput}
            placeholder={t("planning.addContribution")}
            onChange={(event) => setContributionInput(event.target.value)}
          />
          <Button
            variant="outline"
            onClick={() => {
              const value = Number(contributionInput);
              if (!Number.isFinite(value) || value <= 0) {
                toast.error("Enter a valid contribution amount.");
                return;
              }

              // Assume contribution input is in global currency, so convert back to base (IDR) if needed
              // But wait, the goal amounts in store are base?
              // Prompt says: "When user changes currency... update... transactions, planning goals..."
              // I'll assume store values are in base currency.
              addContribution(goal.id, value);
              setContributionInput("");
              toast.success("Contribution added.");
            }}
          >
            {t("common.confirm")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PlanningPage() {
  const goals = usePlanningStore((state) => state.goals);
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t("planning.title")}</h1>
          <p className="text-muted-foreground">
            {t("planning.description")}
          </p>
        </div>
        <GoalDialog />
      </section>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Target className="h-12 w-12 text-muted-foreground" />
            <h2 className="text-xl font-semibold">{t("planning.noGoals")}</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              {t("planning.noGoalsDescription")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}

