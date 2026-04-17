import { Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ActivityPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900">Activity Log</h1>
        <p className="text-neutral-500 mt-1">
          Every action taken by the operating layer and team members.
        </p>
      </div>
      <Card>
        <CardContent className="p-12 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
            <Activity className="w-5 h-5 text-neutral-400" />
          </div>
          <p className="text-neutral-500 text-sm">No activity yet</p>
        </CardContent>
      </Card>
    </div>
  );
}
