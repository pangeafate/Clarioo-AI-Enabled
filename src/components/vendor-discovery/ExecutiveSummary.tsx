/**
 * 🎨 PROTOTYPE MODE: Executive Summary Component
 * Uses mock AI service instead of OpenAI
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Sparkles, Brain, TrendingUp, Award, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { TechRequest, Criteria, Vendor } from "../VendorDiscovery";
import { useExecutiveSummary } from "@/hooks/useExecutiveSummary";
import { TYPOGRAPHY } from '@/styles/typography-config';
import { LoadingState } from "@/components/shared/loading/LoadingState";

interface ExecutiveSummaryProps {
  vendors: Vendor[];
  criteria: Criteria[];
  techRequest: TechRequest;
  calculateOverallScore: (vendor: Vendor) => number;
}

const ExecutiveSummary = ({ vendors, criteria, techRequest, calculateOverallScore }: ExecutiveSummaryProps) => {
  const [summary, setSummary] = useState<string>('');
  const { toast } = useToast();

  // Use executive summary hook for business logic
  const {
    isGenerating,
    generateSummary: generateSummaryFromHook,
    getMarketInsights
  } = useExecutiveSummary();

  useEffect(() => {
    handleGenerateSummary();
  }, [vendors, criteria, techRequest]);

  /**
   * Handle executive summary generation
   * Wrapper around hook method to update local state
   */
  const handleGenerateSummary = async () => {
    try {
      const summaryText = await generateSummaryFromHook(
        vendors,
        criteria,
        techRequest,
        calculateOverallScore
      );

      if (summaryText) {
        setSummary(summaryText);
      }
    } catch (error) {
      console.error('Summary generation failed:', error);
    }
  };

  const insights = getMarketInsights(vendors, calculateOverallScore);

  if (isGenerating) {
    return (
      <Card>
        <CardContent className="py-12">
          <LoadingState
            icon={Brain}
            message="Generating executive summary..."
            description="AI is analyzing vendor data and market insights"
            showProgress={true}
            progress={60}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Executive Summary
          </span>
          <Button onClick={handleGenerateSummary} variant="outline" size="sm" className="gap-2" disabled={isGenerating}>
            <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </Button>
        </CardTitle>
        <CardDescription>
          AI-powered strategic analysis and recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Market Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className={TYPOGRAPHY.label.default}>Market Maturity</span>
            </div>
            <Badge variant="outline" className="bg-primary/10">
              {insights.marketMaturity}
            </Badge>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Award className="h-4 w-4 text-success" />
              <span className={TYPOGRAPHY.label.default}>Competition Level</span>
            </div>
            <Badge variant="outline" className="bg-success/10">
              {insights.competitiveness}
            </Badge>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className={TYPOGRAPHY.label.default}>Overall Quality</span>
            </div>
            <Badge variant="outline" className="bg-warning/10">
              {insights.overallQuality}
            </Badge>
          </div>
        </div>

        {/* AI Summary */}
        <div className="prose prose-sm max-w-none">
          <div className={`${TYPOGRAPHY.body.small} whitespace-pre-line`}>
            {summary}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className={`${TYPOGRAPHY.heading.h4} text-primary`}>{vendors.length}</p>
            <p className={TYPOGRAPHY.muted.xs}>Vendors Analyzed</p>
          </div>
          <div className="text-center">
            <p className={`${TYPOGRAPHY.heading.h4} text-success`}>
              {vendors.filter(v => calculateOverallScore(v) >= 4.0).length}
            </p>
            <p className={TYPOGRAPHY.muted.xs}>Top Matches</p>
          </div>
          <div className="text-center">
            <p className={`${TYPOGRAPHY.heading.h4} text-warning`}>
              {criteria.filter(c => c.importance === 'high').length}
            </p>
            <p className={TYPOGRAPHY.muted.xs}>High Priority Criteria</p>
          </div>
          <div className="text-center">
            <p className={`${TYPOGRAPHY.heading.h4} text-accent`}>
              {vendors.length > 0 ? (vendors.reduce((sum, v) => sum + v.rating, 0) / vendors.length).toFixed(1) : '0'}
            </p>
            <p className={TYPOGRAPHY.muted.xs}>Average Rating</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExecutiveSummary;