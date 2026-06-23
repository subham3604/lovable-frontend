import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SuccessPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/billing");
    }, 4000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card border border-white/5 rounded-2xl p-8 text-center shadow-2xl animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-bounce" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Subscription Successful!</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Thank you for upgrading. Your plan has been successfully activated.
        </p>
        <div className="flex flex-col gap-3">
          <Button onClick={() => navigate("/billing")} className="w-full bg-primary hover:bg-primary/90 rounded-xl">
            Go to Billing Dashboard
          </Button>
          <p className="text-xs text-muted-foreground">
            Redirecting to billing in a few seconds...
          </p>
        </div>
      </div>
    </div>
  );
}

export function CancelPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card border border-white/5 rounded-2xl p-8 text-center shadow-2xl animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Checkout Cancelled</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Your payment was cancelled and your account has not been charged.
        </p>
        <div className="flex flex-col gap-3">
          <Button onClick={() => navigate("/pricing")} className="w-full bg-primary hover:bg-primary/90 rounded-xl">
            View Plans & Pricing
          </Button>
          <Button variant="outline" onClick={() => navigate("/projects")} className="w-full rounded-xl">
            Go to Projects
          </Button>
        </div>
      </div>
    </div>
  );
}
