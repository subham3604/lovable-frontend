import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, ArrowRight } from "lucide-react";
import { api, isAuthenticated } from "@/lib/api";
import { SubscriptionResponse, UsageTodayResponse } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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

export const BillingPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionResponse | null>(null);
  const [usage, setUsage] = useState<UsageTodayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [openingPortal, setOpeningPortal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [subData, usageData] = await Promise.all([
          api.getMySubscription(),
          api.getTodayUsage(),
        ]);
        setSubscription(subData);
        setUsage(usageData);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load billing information",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, toast]);

  const handleOpenPortal = async () => {
    try {
      setOpeningPortal(true);
      const { portalUrl } = await api.openCustomerPortal();
      window.location.href = portalUrl;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open billing portal",
        variant: "destructive",
      });
    } finally {
      setOpeningPortal(false);
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
      <div className="max-w-4xl mx-auto relative z-10">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-10 tracking-tight font-display bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Billing & Subscription</h1>

        {/* Current Subscription */}
        {subscription && (
          <Card className="bg-white/[0.02] border-white/5 mb-8 rounded-2xl backdrop-blur-md p-2">
            <CardHeader>
              <CardTitle className="text-white font-display text-lg font-bold">Current Subscription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-8 bg-white/[0.02] p-6 rounded-xl border border-white/5">
                <div>
                  <p className="text-muted-foreground/60 text-xs font-semibold uppercase tracking-wider mb-2">Plan</p>
                  <p className="text-xl font-bold text-white font-display">{subscription.plan.name}</p>
                  <p className="text-muted-foreground mt-1 text-sm">₹{getPlanPrice(subscription.plan.name) ?? subscription.plan.price}/month</p>
                </div>
                <div>
                  <p className="text-muted-foreground/60 text-xs font-semibold uppercase tracking-wider mb-2">Status</p>
                  <p className="text-xl font-bold text-emerald-400 capitalize font-display">
                    {subscription.status}
                  </p>
                  {subscription.plan.price === "0" ? (
                    <p className="text-muted-foreground mt-1 text-sm">No renewal required</p>
                  ) : (
                    <p className="text-muted-foreground mt-1 text-sm">
                      Renews on{" "}
                      {format(new Date(subscription.currentPeriodEnd), "MMM dd, yyyy")}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-white font-semibold font-display text-sm">Plan Features</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/70 shrink-0" />
                    <span>Max {subscription.plan.maxProjects} projects allowed</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/70 shrink-0" />
                    <span>
                      {subscription.plan.unlimitedAi ? "Unlimited" : subscription.plan.maxTokensPerDay.toLocaleString()}{" "}
                      tokens per day limit
                    </span>
                  </li>
                  {subscription.plan.unlimitedAi && (
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/70 shrink-0" />
                      <span>Unlimited AI usage enabled</span>
                    </li>
                  )}
                </ul>
              </div>

              <div className="flex gap-4 pt-4">
                {subscription.plan.price !== "0" && (
                  <Button
                    onClick={handleOpenPortal}
                    disabled={openingPortal}
                    variant="outline"
                    className="rounded-xl border-white/5 bg-white/5 hover:bg-white/10 hover:text-white"
                  >
                    {openingPortal ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Manage Subscription
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
                <Button onClick={() => navigate("/pricing")} className="rounded-xl bg-primary hover:bg-primary/90 glow-effect font-medium">
                  View Plans
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Today's Usage */}
        {usage && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white font-display">Today's Usage</h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Tokens Usage */}
              <Card className="bg-white/[0.02] border-white/5 rounded-2xl p-2">
                <CardHeader>
                  <CardTitle className="text-white font-display text-base font-bold flex items-center justify-between">
                    Token Usage
                    <span className="text-sm font-normal text-muted-foreground">
                      {usage.tokensUsed} / {usage.tokensLimit}
                    </span>
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground/60">
                    {((usage.tokensUsed / usage.tokensLimit) * 100).toFixed(1)}% used
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Progress
                    value={(usage.tokensUsed / usage.tokensLimit) * 100}
                    className="h-1.5 bg-white/5 [&>div]:bg-primary rounded-full"
                  />
                  <p className="text-[11px] text-muted-foreground/50 pt-2">
                    {usage.tokensLimit - usage.tokensUsed} tokens remaining today
                  </p>
                </CardContent>
              </Card>

              {/* Previews Usage */}
              <Card className="bg-white/[0.02] border-white/5 rounded-2xl p-2">
                <CardHeader>
                  <CardTitle className="text-white font-display text-base font-bold flex items-center justify-between">
                    Active Previews
                    <span className="text-sm font-normal text-muted-foreground">
                      {usage.previewsRunning} / {usage.previewsLimit}
                    </span>
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground/60">
                    {((usage.previewsRunning / usage.previewsLimit) * 100).toFixed(1)}% in use
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Progress
                    value={(usage.previewsRunning / usage.previewsLimit) * 100}
                    className="h-1.5 bg-white/5 [&>div]:bg-primary rounded-full"
                  />
                  <p className="text-[11px] text-muted-foreground/50 pt-2">
                    {usage.previewsLimit - usage.previewsRunning} slots available
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <div className="mt-16">
          <Button variant="outline" className="rounded-xl border-white/5 bg-white/5 hover:bg-white/10 hover:text-white px-6 h-10" onClick={() => navigate("/projects")}>
            Back to Projects
          </Button>
        </div>
      </div>
    </div>
  );
};
