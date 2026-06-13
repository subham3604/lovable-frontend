import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check } from "lucide-react";
import { api, isAuthenticated } from "@/lib/api";
import { PlanResponse, SubscriptionResponse } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const PLAN_PRICES: Record<string, number> = {
  "pro plan": 199,
  "elite plan": 699,
  "unlimited plan": 1599,
  // also match without suffix just in case
  pro: 199,
  elite: 699,
  unlimited: 1599,
};

const getPlanPrice = (name: string): number | null => {
  return PLAN_PRICES[name.toLowerCase()] ?? null;
};

export const PricingPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plans, setPlans] = useState<PlanResponse[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [plansData, subData] = await Promise.all([
          api.getAllPlans(),
          api.getMySubscription().catch(() => null),
        ]);
        setPlans(plansData);
        setSubscription(subData);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load pricing information",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, toast]);

  const handleUpgrade = async (planId: number) => {
    if (subscription?.plan.id === planId) {
      toast({
        title: "Info",
        description: "You're already on this plan",
      });
      return;
    }

    if (subscription && subscription.plan.id !== 0 && subscription.plan.price !== "0") {
      toast({
        title: "Subscription Active",
        description: "Please manage or change your plan using the Billing & Subscription page.",
      });
      navigate("/billing");
      return;
    }

    try {
      setCheckingOut(planId);
      const { checkoutUrl } = await api.createCheckout(planId);
      window.location.href = checkoutUrl;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create checkout session",
        variant: "destructive",
      });
    } finally {
      setCheckingOut(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-16 px-6 relative overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-display bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent mb-4">Pricing Plans</h1>
          <p className="text-base text-muted-foreground max-w-md mx-auto">
            Choose the perfect plan for your needs and start building without limits.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => {
            const isCurrentPlan = subscription?.plan.id === plan.id;
            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border-white/5 bg-white/[0.02] backdrop-blur-md transition-all duration-300 ${
                  isCurrentPlan
                    ? "ring-2 ring-primary bg-white/[0.04] shadow-xl shadow-primary/5"
                    : "hover:bg-white/[0.04] hover:-translate-y-1 hover:shadow-2xl"
                }`}
              >
                {isCurrentPlan && (
                  <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground font-semibold rounded-lg text-[10px] uppercase tracking-wider px-2 py-0.5">Current Plan</Badge>
                )}

                <CardHeader className="p-6">
                  <CardTitle className="text-white font-display text-xl font-bold mb-1">{plan.name}</CardTitle>
                  <CardDescription className="text-muted-foreground flex items-baseline gap-1.5 mt-2">
                    <span className="text-4xl font-extrabold text-white tracking-tight font-display">₹{getPlanPrice(plan.name) ?? plan.price}</span>
                    <span className="text-xs text-muted-foreground/60">/month</span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col p-6 pt-0">
                  <div className="space-y-4 mb-8 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground/90">
                        {plan.maxProjects} projects
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground/90">
                        {plan.unlimitedAi
                          ? "Unlimited"
                          : `${plan.maxTokensPerDay.toLocaleString()}`}{" "}
                        tokens/day
                      </span>
                    </div>
                    {plan.unlimitedAi && (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-sm text-muted-foreground/90">Unlimited AI model access</span>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={checkingOut === plan.id}
                    variant={isCurrentPlan ? "outline" : "default"}
                    className={`w-full h-11 rounded-xl font-medium transition-all duration-150 ${isCurrentPlan ? "border-white/10 hover:bg-white/5 hover:text-white" : "bg-primary hover:bg-primary/90 glow-effect"}`}
                  >
                    {checkingOut === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrentPlan ? (
                      "Current Plan"
                    ) : (
                      "Upgrade"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-16">
          <Button variant="outline" className="rounded-xl border-white/5 bg-white/5 hover:bg-white/10 hover:text-white px-6 h-10" onClick={() => navigate("/projects")}>
            Back to Projects
          </Button>
        </div>
      </div>
    </div>
  );
};
