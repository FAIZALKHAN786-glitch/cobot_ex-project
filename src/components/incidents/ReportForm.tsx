"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/auth/use-toast";
import { useNavigate } from "react-router-dom";
import { createIncident } from "@/services/api";
import { type IncidentCategory, type IncidentSeverity } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Smartphone, AlertCircle, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const reportSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  category: z.enum([
    "fire",
    "medical",
    "flood",
    "earthquake",
    "police",
    "infrastructure",
    "other",
  ]),
  severity: z.enum(["low", "medium", "high", "critical"]),
  address: z.string().min(3, "Please enter a location"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  reporterName: z.string().optional(),
  reporterPhone: z
    .string()
    .optional()
    .refine((val) => !val || /^\+?[\d\s\-()]{7,}$/.test(val), {
      message: "Invalid phone number",
    }),
});

type ReportFormValues = z.infer<typeof reportSchema>;

interface ReportFormProps {
  className?: string;
}

export function ReportForm({ className }: ReportFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      title: "",
      category: "fire",
      severity: "medium",
      address: "",
      description: "",
      reporterName: "",
      reporterPhone: "",
    },
  });

  const mutation = useMutation({
    mutationFn: createIncident,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      toast({
        title: "Incident reported",
        description: `Reference number: ${data.referenceNumber}`,
      });
      navigate(`/report/success?ref=${data.referenceNumber}`);
    },
    onError: (err: Error) => {
      toast({
        title: "Report failed",
        description: err.message || "Something went wrong. Please try again.",
      });
    },
  });

  const onSubmit = (data: ReportFormValues) => {
    mutation.mutate({
      title: data.title,
      category: data.category,
      severity: data.severity,
      description: data.description,
      location: {
        lat: 40.7128,
        lng: -74.006,
        address: data.address,
      },
      reporterName: data.reporterName || undefined,
      reporterPhone: data.reporterPhone || undefined,
    });
  };

  const handleGeolocate = () => {
    setIsGeolocating(true);
    if (!navigator.geolocation) {
      setIsGeolocating(false);
      toast({
        title: "Geolocation not supported",
        description: "Please enter your address manually.",
      });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGeolocating(false);
        toast({
          title: "Location detected",
          description: `Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`,
        });
      },
      () => {
        setIsGeolocating(false);
        toast({
          title: "Location access denied",
          description: "Please enter your address manually.",
        });
      }
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const categoryOptions: { value: IncidentCategory; label: string }[] = [
    { value: "fire", label: "Fire" },
    { value: "medical", label: "Medical" },
    { value: "flood", label: "Flood" },
    { value: "earthquake", label: "Earthquake" },
    { value: "police", label: "Police / Crime" },
    { value: "infrastructure", label: "Infrastructure" },
    { value: "other", label: "Other" },
  ];

  const severityOptions: { value: IncidentSeverity; label: string }[] = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "critical", label: "Critical" },
  ];

  return (
    <Card className={cn(className, "animate-enter")}>
      <CardHeader>
        <CardTitle className="text-lg">Report an Emergency</CardTitle>
        <p className="text-sm text-slate-500">
          Fill in the details below. Required fields are marked.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="title">Incident Title</Label>
              <Input
                id="title"
                placeholder="e.g. Kitchen fire on Maple St"
                {...register("title")}
              />
              {errors.title && (
                <span className="text-xs text-destructive">{errors.title.message}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select defaultValue="fire">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <span className="text-xs text-destructive">{errors.category.message}</span>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="severity">Severity</Label>
            <Select defaultValue="medium">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {severityOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.severity && (
              <span className="text-xs text-destructive">{errors.severity.message}</span>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Location / Address</Label>
            <div className="relative">
              <Input
                id="address"
                placeholder="Street address, city, or landmark"
                {...register("address")}
              />
              {previewUrl && (
                <div className="absolute right-2 top-2 flex items-center gap-2 p-1 bg-white border border-slate-200 rounded shadow-sm">
                  <img src={previewUrl} alt="preview" className="h-8 w-8 rounded" />
                  <button
                    type="button"
                    onClick={() => setPreviewUrl(null)}
                    className="p-1 text-slate-500 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={handleGeolocate}
                disabled={isGeolocating}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-critical-600 disabled:opacity-50 transition-colors"
                aria-label="Use device geolocation"
              >
                {isGeolocating ? (
                  <Clock className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.address && (
              <span className="text-xs text-destructive">{errors.address.message}</span>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What happened? Include any important details."
              {...register("description")}
            />
            {errors.description && (
              <span className="text-xs text-destructive">{errors.description.message}</span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="reporterName">Contact Name (optional)</Label>
              <Input id="reporterName" placeholder="Your name" {...register("reporterName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reporterPhone">Contact Phone (optional)</Label>
              <Input
                id="reporterPhone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                {...register("reporterPhone")}
              />
              {errors.reporterPhone && (
                <span className="text-xs text-destructive">{errors.reporterPhone.message}</span>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="media">Photo / Video (optional)</Label>
            <input
              id="media"
              type="file"
              accept="image/*,video/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
            />
            <p className="text-xs text-slate-400">
              Mock upload only — preview shown, no actual storage.
            </p>
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-critical-600 text-white hover:bg-critical-700 shadow-lg shadow-critical-200 glow hover:shadow-critical-400 active:scale-[0.97] flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <AlertCircle className="h-4 w-4 mr-2 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Smartphone className="h-4 w-4 mr-2" />
                Submit Emergency Report
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
