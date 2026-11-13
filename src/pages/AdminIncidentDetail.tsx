import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getIncident, updateIncident } from "@/services/api";
import { useToast } from "@/components/auth/use-toast";
import { StatusTimeline } from "@/components/incidents/StatusTimeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { SeverityBadge } from "@/components/incidents/SeverityBadge";
import { StatusBadge } from "@/components/incidents/StatusBadge";
import { CategoryChip } from "@/components/incidents/CategoryChip";
import { EmergencyMap } from "@/components/incidents/EmergencyMap";
import { formatDateTime } from "@/lib/utils";
import {
  type IncidentCategory,
  type IncidentSeverity,
  type IncidentStatus,
} from "@/types";
import { MapPin, Edit2, Save, AlertCircle, ArrowLeft } from "lucide-react";

const CATEGORY_OPTIONS: { value: IncidentCategory; label: string }[] = [
  { value: "fire", label: "Fire" },
  { value: "medical", label: "Medical" },
  { value: "flood", label: "Flood" },
  { value: "earthquake", label: "Earthquake" },
  { value: "police", label: "Police / Crime" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "other", label: "Other" },
];

const SEVERITY_OPTIONS: { value: IncidentSeverity; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const STATUS_OPTIONS: { value: IncidentStatus; label: string }[] = [
  { value: "reported", label: "Reported" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "dispatched", label: "Dispatched" },
  { value: "on-scene", label: "On Scene" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AdminIncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: incident, isLoading, error } = useQuery({
    queryKey: ["incident", id],
    queryFn: () => (id ? getIncident(id) : Promise.reject(new Error("No ID"))),
    enabled: !!id,
  });

  const [editMode, setEditMode] = React.useState(false);
  const [category, setCategory] = React.useState<IncidentCategory>(
    incident?.category ?? "fire"
  );
  const [severity, setSeverity] = React.useState<IncidentSeverity>(
    incident?.severity ?? "medium"
  );
  const [status, setStatus] = React.useState<IncidentStatus>(
    incident?.status ?? "reported"
  );
  const [adminNotes, setAdminNotes] = React.useState<string>(
    incident?.adminNotes ?? ""
  );

  const mutation = useMutation({
    mutationFn: () =>
      updateIncident(id!, {
        category,
        severity,
        status,
        adminNotes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["incident", id] });
      setEditMode(false);
      toast({ title: "Incident updated", description: "Changes saved successfully." });
    },
    onError: (err: Error) => {
      toast({ title: "Update failed", description: err.message });
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertCircle className="h-8 w-8 text-slate-400 animate-spin" />
        <p className="mt-2 text-slate-500">Loading incident…</p>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="text-center p-8">
        <p className="text-destructive">Incident not found.</p>
        <button
          onClick={() => navigate("/admin")}
          className="mt-4 text-sm underline text-critical-600"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Details */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {incident.title}
              </h1>
              <p className="text-sm text-slate-500">
                Reference: {incident.referenceNumber}
              </p>
            </div>
            <div className="flex gap-2">
              {editMode ? (
                <Button
                  onClick={() => {
                    setCategory(incident.category);
                    setSeverity(incident.severity);
                    setStatus(incident.status);
                    setAdminNotes(incident.adminNotes ?? "");
                    setEditMode(false);
                  }}
                  variant="outline"
                >
                  <AlertCircle className="h-4 w-4 mr-2" /> Cancel
                </Button>
              ) : (
                <Button onClick={() => setEditMode(true)}>
                  <Edit2 className="h-4 w-4 mr-2" /> Edit Classification
                </Button>
              )}
              <Button asChild variant="outline" className="px-3">
                <a href="/admin">
                  <ArrowLeft className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 uppercase font-semibold">
                Category
              </p>
              <CategoryChip category={incident.category} className="mt-1" />
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 uppercase font-semibold">
                Severity
              </p>
              <SeverityBadge severity={incident.severity} className="mt-1" />
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 uppercase font-semibold">
                Status
              </p>
              <StatusBadge status={incident.status} className="mt-1" />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Description
              </p>
              <p className="text-slate-600">{incident.description}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Location
              </p>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="h-4 w-4" />
                <span>{incident.location.address}</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Reported
              </p>
              <p className="text-sm text-slate-600">
                {formatDateTime(incident.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Last Updated
              </p>
              <p className="text-sm text-slate-600">
                {formatDateTime(incident.updatedAt)}
              </p>
            </div>
            {incident.reporterName && (
              <div>
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Reporter
                </p>
                <p className="text-sm text-slate-600">
                  {incident.reporterName}
                  {incident.reporterPhone && ` (${incident.reporterPhone})`}
                </p>
              </div>
            )}
            {incident.assignedTo && (
              <div>
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Assigned To
                </p>
                <p className="text-sm text-slate-600">
                  {incident.assignedTo}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Status timeline */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <CardHeader>
            <CardTitle className="text-lg">Status History</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusTimeline
              status={incident.status}
              updatedAt={incident.updatedAt}
            />
          </CardContent>
        </div>
      </div>

      {/* Right: Map + Edit form */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Incident Location
          </h3>
          <EmergencyMap
            incidents={[incident]}
            center={[incident.location.lat, incident.location.lng]}
            zoom={15}
            height="300px"
          />
        </div>

        {editMode && (
          <Card className="bg-white border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Update Incident</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={category}
                  onValueChange={(v: string) => setCategory(v as IncidentCategory)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-severity">Severity</Label>
                <Select
                  value={severity}
                  onValueChange={(v: string) => setSeverity(v as IncidentSeverity)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={status}
                  onValueChange={(v: string) => setStatus(v as IncidentStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Admin Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={adminNotes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setAdminNotes(e.target.value)
                  }
                  placeholder="Add internal notes…"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => {
                    setCategory(incident.category);
                    setSeverity(incident.severity);
                    setStatus(incident.status);
                    setAdminNotes(incident.adminNotes ?? "");
                    setEditMode(false);
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => mutation.mutate()}
                  disabled={mutation.isPending}
                  className="bg-critical-600 text-white hover:bg-critical-700"
                >
                  {mutation.isPending ? (
                    <>
                      <Save className="h-4 w-4 animate-spin mr-2" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
