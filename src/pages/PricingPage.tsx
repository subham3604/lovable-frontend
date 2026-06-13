import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check } from "lucide-react";
import { api, isAuthenticated } from "@/lib/api";
import { PlanResponse, SubscriptionResponse } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

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
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Pricing Plans</h1>
          <p className="text-xl text-slate-300">
            Choose the perfect plan for your needs
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isCurrentPlan = subscription?.plan.id === plan.id;
            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col ${
                  isCurrentPlan
                    ? "ring-2 ring-primary bg-slate-800"
                    : "bg-slate-800/50 hover:bg-slate-800/75 transition-colors"
                }`}
              >
                {isCurrentPlan && (
                  <Badge className="absolute top-4 right-4 bg-primary">Current Plan</Badge>
                )}

                <CardHeader>
                  <CardTitle className="text-white">{plan.name}</CardTitle>
                  <CardDescription className="text-slate-400">
                    <span className="text-3xl font-bold text-white">${plan.price}</span>
                    <span className="text-slate-400">/month</span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  <div className="space-y-4 mb-8 flex-1">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-slate-300">
                        {plan.maxProjects} projects
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-slate-300">
                        {plan.unlimitedAi
                          ? "Unlimited"
                          : `${plan.maxTokensPerDay.toLocaleString()}`}{" "}
                        tokens/day
                      </span>
                    </div>
                    {plan.unlimitedAi && (
                      <div className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-slate-300">Unlimited AI</span>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={checkingOut === plan.id}
                    variant={isCurrentPlan ? "outline" : "default"}
                    className="w-full"
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

        <div className="text-center mt-12">
          <Button variant="outline" onClick={() => navigate("/projects")}>
            Back to Projects
          </Button>
        </div>
      </div>
    </div>
  );
};
