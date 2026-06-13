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
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Billing & Subscription</h1>

        {/* Current Subscription */}
        {subscription && (
          <Card className="bg-slate-800/50 border-slate-700 mb-8">
            <CardHeader>
              <CardTitle className="text-white">Current Subscription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <p className="text-slate-400 text-sm mb-2">Plan</p>
                  <p className="text-2xl font-bold text-white">{subscription.plan.name}</p>
                  <p className="text-slate-400 mt-1">₹{getPlanPrice(subscription.plan.name) ?? subscription.plan.price}/month</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-2">Status</p>
                  <p className="text-2xl font-bold text-green-500 capitalize">
                    {subscription.status}
                  </p>
                  {subscription.plan.price === "0" ? (
                    <p className="text-slate-400 mt-1">No renewal required</p>
                  ) : (
                    <p className="text-slate-400 mt-1">
                      Renews on{" "}
                      {format(new Date(subscription.currentPeriodEnd), "MMM dd, yyyy")}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-white font-semibold">Plan Features</h3>
                <ul className="space-y-2 text-slate-300">
                  <li>• Max {subscription.plan.maxProjects} projects</li>
                  <li>
                    • {subscription.plan.unlimitedAi ? "Unlimited" : subscription.plan.maxTokensPerDay.toLocaleString()}{" "}
                    tokens per day
                  </li>
                  {subscription.plan.unlimitedAi && <li>• Unlimited AI usage</li>}
                </ul>
              </div>

              <div className="flex gap-4 pt-4">
                {subscription.plan.price !== "0" && (
                  <Button
                    onClick={handleOpenPortal}
                    disabled={openingPortal}
                    variant="outline"
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
                <Button onClick={() => navigate("/pricing")} variant="default">
                  View Plans
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Today's Usage */}
        {usage && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Today's Usage</h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Tokens Usage */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    Token Usage
                    <span className="text-sm font-normal text-slate-400">
                      {usage.tokensUsed} / {usage.tokensLimit}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    {((usage.tokensUsed / usage.tokensLimit) * 100).toFixed(1)}% used
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Progress
                    value={(usage.tokensUsed / usage.tokensLimit) * 100}
                    className="h-2"
                  />
                  <p className="text-xs text-slate-400 mt-4">
                    {usage.tokensLimit - usage.tokensUsed} tokens remaining
                  </p>
                </CardContent>
              </Card>

              {/* Previews Usage */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    Active Previews
                    <span className="text-sm font-normal text-slate-400">
                      {usage.previewsRunning} / {usage.previewsLimit}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    {((usage.previewsRunning / usage.previewsLimit) * 100).toFixed(1)}% in use
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Progress
                    value={(usage.previewsRunning / usage.previewsLimit) * 100}
                    className="h-2"
                  />
                  <p className="text-xs text-slate-400 mt-4">
                    {usage.previewsLimit - usage.previewsRunning} slots available
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <div className="mt-12">
          <Button variant="outline" onClick={() => navigate("/projects")}>
            Back to Projects
          </Button>
        </div>
      </div>
    </div>
  );
};
