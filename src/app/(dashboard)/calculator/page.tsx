"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrency } from "@/hooks/use-currency";
import { useTranslation } from "@/hooks/use-translation";

function safeEvaluate(expression: string) {
  if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
    return "Invalid";
  }

  try {
    const result = Function(`"use strict"; return (${expression})`)();
    if (typeof result !== "number" || Number.isNaN(result)) {
      return "Invalid";
    }

    return String(result);
  } catch {
    return "Invalid";
  }
}

function StandardCalculator() {
  const [value, setValue] = useState("0");
  const { t } = useTranslation();

  const keys = [
    "7",
    "8",
    "9",
    "/",
    "4",
    "5",
    "6",
    "*",
    "1",
    "2",
    "3",
    "-",
    "0",
    ".",
    "=",
    "+",
  ];

  const append = (key: string) => {
    if (key === "=") {
      setValue(safeEvaluate(value));
      return;
    }

    setValue((current) => (current === "0" ? key : `${current}${key}`));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("calculator.standard")} {t("common.calculator")}</CardTitle>
        <CardDescription>Quick arithmetic for daily operations.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input value={value} onChange={(event) => setValue(event.target.value)} />
        <div className="grid grid-cols-4 gap-2">
          <Button variant="outline" onClick={() => setValue("0")}>C</Button>
          <Button variant="outline" onClick={() => setValue((current) => current.slice(0, -1) || "0")}>DEL</Button>
          <Button variant="outline" onClick={() => setValue((current) => `${current}(`)}>(</Button>
          <Button variant="outline" onClick={() => setValue((current) => `${current})`)}>)</Button>
          {keys.map((key) => (
            <Button key={key} onClick={() => append(key)}>
              {key}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ScientificCalculator() {
  const [input, setInput] = useState("45");
  const { t } = useTranslation();

  const value = Number(input || 0);

  const results = useMemo(
    () => ({
      sin: Math.sin((value * Math.PI) / 180),
      cos: Math.cos((value * Math.PI) / 180),
      tan: Math.tan((value * Math.PI) / 180),
      log: value > 0 ? Math.log10(value) : NaN,
      sqrt: value >= 0 ? Math.sqrt(value) : NaN,
      square: value ** 2,
    }),
    [value]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("calculator.scientific")} {t("common.calculator")}</CardTitle>
        <CardDescription>Trigonometry and logarithmic functions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>{t("calculator.input")}</Label>
          <Input type="number" value={input} onChange={(event) => setInput(event.target.value)} />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <ResultCard label="sin(x)" value={results.sin} />
          <ResultCard label="cos(x)" value={results.cos} />
          <ResultCard label="tan(x)" value={results.tan} />
          <ResultCard label="log10(x)" value={results.log} />
          <ResultCard label="sqrt(x)" value={results.sqrt} />
          <ResultCard label="x^2" value={results.square} />
        </div>
      </CardContent>
    </Card>
  );
}

function ResultCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{Number.isFinite(value) ? value.toFixed(6) : "Invalid"}</p>
    </div>
  );
}

function FinancialCalculatorSuite() {
  return (
    <Tabs defaultValue="roi" className="space-y-4">
      <TabsList>
        <TabsTrigger value="roi">ROI</TabsTrigger>
        <TabsTrigger value="compound">Compound</TabsTrigger>
        <TabsTrigger value="loan">Loan</TabsTrigger>
        <TabsTrigger value="installment">Installment</TabsTrigger>
        <TabsTrigger value="goal">Savings Goal</TabsTrigger>
      </TabsList>

      <TabsContent value="roi">
        <RoiCalculator />
      </TabsContent>
      <TabsContent value="compound">
        <CompoundCalculator />
      </TabsContent>
      <TabsContent value="loan">
        <LoanCalculator />
      </TabsContent>
      <TabsContent value="installment">
        <InstallmentCalculator />
      </TabsContent>
      <TabsContent value="goal">
        <SavingsGoalCalculator />
      </TabsContent>
    </Tabs>
  );
}

function RoiCalculator() {
  const [investment, setInvestment] = useState("10000");
  const [currentValue, setCurrentValue] = useState("12500");
  const { format } = useCurrency();
  const { t } = useTranslation();

  const result = useMemo(() => {
    const initial = Number(investment);
    const current = Number(currentValue);

    if (initial <= 0 || current < 0) {
      return null;
    }

    const gain = current - initial;
    const roi = (gain / initial) * 100;

    return { gain, roi };
  }, [investment, currentValue]);

  return (
    <FinancialCard title={t("calculator.roi.title")} description={t("calculator.roi.description")}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("calculator.roi.initial")} value={investment} onChange={setInvestment} />
        <Field label={t("calculator.roi.current")} value={currentValue} onChange={setCurrentValue} />
      </div>
      {result ? (
        <ResultSummary
          rows={[
            { label: t("calculator.roi.netGain"), value: format(result.gain) },
            { label: t("calculator.roi.roi"), value: `${result.roi.toFixed(2)}%` },
          ]}
        />
      ) : null}
    </FinancialCard>
  );
}

function CompoundCalculator() {
  const [principal, setPrincipal] = useState("5000");
  const [monthly, setMonthly] = useState("300");
  const [rate, setRate] = useState("8");
  const [years, setYears] = useState("10");
  const { format } = useCurrency();
  const { t } = useTranslation();

  const result = useMemo(() => {
    const P = Number(principal);
    const PMT = Number(monthly);
    const r = Number(rate) / 100 / 12;
    const n = Number(years) * 12;

    if (n <= 0 || r < 0 || P < 0 || PMT < 0) {
      return null;
    }

    const futureValue = P * (1 + r) ** n + PMT * (((1 + r) ** n - 1) / (r || 1));
    const invested = P + PMT * n;

    return {
      futureValue,
      invested,
      interest: futureValue - invested,
    };
  }, [principal, monthly, rate, years]);

  return (
    <FinancialCard title={t("calculator.compound.title")} description={t("calculator.compound.description")}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("calculator.compound.principal")} value={principal} onChange={setPrincipal} />
        <Field label={t("calculator.compound.monthly")} value={monthly} onChange={setMonthly} />
        <Field label={t("calculator.compound.rate")} value={rate} onChange={setRate} />
        <Field label={t("calculator.compound.years")} value={years} onChange={setYears} />
      </div>
      {result ? (
        <ResultSummary
          rows={[
            { label: t("calculator.compound.futureValue"), value: format(result.futureValue) },
            { label: t("calculator.compound.invested"), value: format(result.invested) },
            { label: t("calculator.compound.growth"), value: format(result.interest) },
          ]}
        />
      ) : null}
    </FinancialCard>
  );
}

function LoanCalculator() {
  const [amount, setAmount] = useState("75000");
  const [rate, setRate] = useState("6");
  const [years, setYears] = useState("7");
  const { format } = useCurrency();
  const { t } = useTranslation();

  const result = useMemo(() => {
    const P = Number(amount);
    const r = Number(rate) / 100 / 12;
    const n = Number(years) * 12;

    if (P <= 0 || n <= 0 || r < 0) {
      return null;
    }

    const emi = r === 0 ? P / n : (P * r * (1 + r) ** n) / ((1 + r) ** n - 1);
    const total = emi * n;

    return { emi, total, interest: total - P };
  }, [amount, rate, years]);

  return (
    <FinancialCard title={t("calculator.loan.title")} description={t("calculator.loan.description")}>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={t("calculator.loan.amount")} value={amount} onChange={setAmount} />
        <Field label={t("calculator.loan.rate")} value={rate} onChange={setRate} />
        <Field label={t("calculator.loan.years")} value={years} onChange={setYears} />
      </div>
      {result ? (
        <ResultSummary
          rows={[
            { label: t("calculator.loan.emi"), value: format(result.emi) },
            { label: t("calculator.loan.repayment"), value: format(result.total) },
            { label: t("calculator.loan.interest"), value: format(result.interest) },
          ]}
        />
      ) : null}
    </FinancialCard>
  );
}

function InstallmentCalculator() {
  const [price, setPrice] = useState("1200");
  const [downPayment, setDownPayment] = useState("200");
  const [months, setMonths] = useState("12");
  const { format } = useCurrency();
  const { t } = useTranslation();

  const result = useMemo(() => {
    const total = Number(price);
    const down = Number(downPayment);
    const tenor = Number(months);

    if (total <= 0 || down < 0 || tenor <= 0 || down > total) {
      return null;
    }

    const remaining = total - down;
    const monthly = remaining / tenor;

    return { remaining, monthly };
  }, [price, downPayment, months]);

  return (
    <FinancialCard title={t("calculator.installment.title")} description={t("calculator.installment.description")}>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={t("calculator.installment.price")} value={price} onChange={setPrice} />
        <Field label={t("calculator.installment.downPayment")} value={downPayment} onChange={setDownPayment} />
        <Field label={t("calculator.installment.tenor")} value={months} onChange={setMonths} />
      </div>
      {result ? (
        <ResultSummary
          rows={[
            { label: t("calculator.installment.financed"), value: format(result.remaining) },
            { label: t("calculator.installment.monthly"), value: format(result.monthly) },
          ]}
        />
      ) : null}
    </FinancialCard>
  );
}

function SavingsGoalCalculator() {
  const [target, setTarget] = useState("100000");
  const [rate, setRate] = useState("7");
  const [years, setYears] = useState("10");
  const { format } = useCurrency();
  const { t } = useTranslation();

  const result = useMemo(() => {
    const FV = Number(target);
    const r = Number(rate) / 100 / 12;
    const n = Number(years) * 12;

    if (FV <= 0 || n <= 0 || r < 0) {
      return null;
    }

    const monthly = r === 0 ? FV / n : FV * (r / ((1 + r) ** n - 1));
    const invested = monthly * n;

    return {
      monthly,
      invested,
      growth: FV - invested,
    };
  }, [target, rate, years]);

  return (
    <FinancialCard title={t("calculator.goal.title")} description={t("calculator.goal.description")}>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={t("calculator.goal.target")} value={target} onChange={setTarget} />
        <Field label={t("calculator.goal.return")} value={rate} onChange={setRate} />
        <Field label={t("calculator.goal.years")} value={years} onChange={setYears} />
      </div>
      {result ? (
        <ResultSummary
          rows={[
            { label: t("calculator.goal.required"), value: format(result.monthly) },
            { label: t("calculator.goal.contribution"), value: format(result.invested) },
            { label: t("calculator.goal.growth"), value: format(result.growth) },
          ]}
        />
      ) : null}
    </FinancialCard>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type="number" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function FinancialCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function ResultSummary({ rows }: { rows: Array<{ label: string; value: string }> }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="grid gap-2 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label}>
            <p className="text-xs text-muted-foreground">{row.label}</p>
            <p className="text-sm font-semibold">{row.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CalculatorPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("calculator.title")}</h1>
        <p className="text-muted-foreground">
          {t("calculator.description")}
        </p>
      </div>

      <Tabs defaultValue="standard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="standard">{t("calculator.standard")}</TabsTrigger>
          <TabsTrigger value="scientific">{t("calculator.scientific")}</TabsTrigger>
          <TabsTrigger value="financial">{t("calculator.financial")}</TabsTrigger>
        </TabsList>

        <TabsContent value="standard">
          <StandardCalculator />
        </TabsContent>

        <TabsContent value="scientific">
          <ScientificCalculator />
        </TabsContent>

        <TabsContent value="financial">
          <FinancialCalculatorSuite />
        </TabsContent>
      </Tabs>
    </div>
  );
}

