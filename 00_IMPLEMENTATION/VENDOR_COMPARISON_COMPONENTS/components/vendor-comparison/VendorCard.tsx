/**
 * VendorCard Component
 * Sprint: SP_015 (Revised)
 *
 * Horizontal vendor card with company name, match percentage, and info button
 * Includes navigation arrows for cycling through vendors
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Info, Bot, Trash2, Star, RotateCcw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ComparisonVendor } from '../../types/comparison.types';
import { Button } from '../ui/button';
import { SPACING } from '../../styles/spacing-config';
import { useToast } from '../../hooks/use-toast';

interface VendorCardProps {
  vendor: ComparisonVendor | null;
  currentIndex: number;
  totalVendors: number;
  onNavigate: (direction: 'next' | 'previous') => void;
  onInfoClick?: () => void;
  className?: string;
  isShortlisted?: boolean;
  onToggleShortlist?: (vendorId: string) => void;
  onRetryVendor?: (vendorId: string) => void;
}

const colorClasses = {
  green: {
    bg: 'bg-green-100',
    border: 'border-green-200',
    text: 'text-green-900',
    matchBg: 'bg-white',
    accent: 'bg-green-500',
  },
  orange: {
    bg: 'bg-orange-100',
    border: 'border-orange-200',
    text: 'text-orange-900',
    matchBg: 'bg-white',
    accent: 'bg-orange-500',
  },
  blue: {
    bg: 'bg-blue-100',
    border: 'border-blue-200',
    text: 'text-blue-900',
    matchBg: 'bg-white',
    accent: 'bg-blue-500',
  },
};

export const VendorCard: React.FC<VendorCardProps> = ({
  vendor,
  currentIndex,
  totalVendors,
  onNavigate,
  onInfoClick,
  className = '',
  isShortlisted = false,
  onToggleShortlist,
  onRetryVendor,
}) => {
  const { toast } = useToast();
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < totalVendors - 1;

  // Navigation counter state - show both counters when any arrow is clicked
  const [showCounters, setShowCounters] = useState(false);

  // Expansion state for accordion
  const [isExpanded, setIsExpanded] = useState(false);

  // Star shine animation state
  const [isShining, setIsShining] = useState(false);

  // Check if vendor has failed
  const isFailed = vendor?.comparisonStatus === 'failed';
  const isTimeout = vendor?.comparisonErrorCode === 'TIMEOUT';

  const handleToggleShortlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (vendor && onToggleShortlist) {
      onToggleShortlist(vendor.id);
      if (!isShortlisted) {
        // Adding to shortlist
        setIsShining(true);
        setTimeout(() => setIsShining(false), 600);
        toast({
          title: "Added to the shortlist for outreach",
          description: `${vendor.name} has been shortlisted.`
        });
      } else {
        // Removing from shortlist
        toast({
          title: "Removed from shortlist",
          description: `${vendor.name} has been removed from the shortlist.`
        });
      }
    }
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (vendor && onRetryVendor) {
      onRetryVendor(vendor.id);
      toast({
        title: "Retrying comparison",
        description: `Re-researching ${vendor.name}...`
      });
    }
  };

  // Calculate vendors to left and right
  const vendorsToLeft = currentIndex;
  const vendorsToRight = totalVendors - currentIndex - 1;

  // Show counters briefly on navigation
  useEffect(() => {
    if (showCounters) {
      const timer = setTimeout(() => setShowCounters(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [showCounters]);

  const handleNavigate = (direction: 'next' | 'previous') => {
    // Show both counters regardless of which arrow is clicked
    setShowCounters(true);
    onNavigate(direction);
  };

  // Allow clicking disabled arrows to show counters
  const handleDisabledClick = () => {
    setShowCounters(true);
  };

  return (
    <div className={`vendor-card-wrapper ${className}`}>
      <div className={`flex items-center ${SPACING.vendorComparison.navigation.gap}`}>
        {/* Previous Arrow with Counter */}
        <div className="relative flex-shrink-0">
          <div
            onClick={(e) => {
              e.stopPropagation();
              hasPrevious ? handleNavigate('previous') : handleDisabledClick();
            }}
            className="cursor-pointer"
          >
            <Button
              variant="ghost"
              size="icon"
              disabled={!hasPrevious}
              className="h-8 w-8 pointer-events-none"
              asChild
            >
              <div>
                <ChevronLeft className="h-5 w-5" />
              </div>
            </Button>
          </div>

          {/* Left Counter - Always show when counters are visible */}
          <AnimatePresence>
            {showCounters && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.3 }}
                className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-gray-500 whitespace-nowrap"
              >
                {vendorsToLeft}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Vendor Card Content - Clickable to expand */}
        <motion.div
          key={vendor?.id ?? 'empty'}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            borderColor: vendor?.color?.hex ?? '#d1d5db'
          }}
          className={`flex-1 flex items-center border-2 rounded-2xl ${SPACING.vendorComparison.card.container} min-w-0 overflow-hidden cursor-pointer hover:shadow-md transition-shadow relative bg-white`}
        >
          {/* Retry Button (for failed vendors) or Info Icon - Top Right */}
          <div className="absolute top-2 right-2">
            {isFailed ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRetry}
                className="h-6 w-6 hover:bg-orange-50"
                title={isTimeout ? "Timeout - Click to retry" : "Error - Click to retry"}
              >
                {isTimeout ? (
                  <RotateCcw className="h-4 w-4 text-orange-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
              </Button>
            ) : (
              <Info className="h-4 w-4 text-gray-400" />
            )}
          </div>

          {/* Logo + Vendor Info */}
          <div className="flex items-center gap-3 min-w-0 pr-6">
            {/* Company Logo */}
            {vendor?.website && (
              <img
                src={`https://img.logo.dev/${vendor.website.replace(/^https?:\/\//, '').split('/')[0]}?token=pk_Fvbs8Zl6SWiC5WEoP8Qzbg`}
                alt={`${vendor.name} logo`}
                className="w-8 h-8 rounded-md object-contain flex-shrink-0 bg-white"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            {/* Vendor Info - Company Name + Match % stacked */}
            <div className={`min-w-0 ${SPACING.vendorComparison.card.leftSection}`}>
              <div style={{ color: vendor?.color?.hex ?? '#111827' }} className="font-semibold truncate text-sm sm:text-base leading-tight">
                {vendor?.name ?? 'No vendor selected'}
              </div>
              <div style={{ color: vendor?.color?.hex ?? '#111827' }} className="text-xs sm:text-sm opacity-80 mt-1">
                Match {vendor?.matchPercentage === -1 || vendor?.matchPercentage === undefined ? '--' : vendor.matchPercentage}%
              </div>
            </div>
          </div>
        </motion.div>

        {/* Next Arrow with Counter */}
        <div className="relative flex-shrink-0">
          <div
            onClick={(e) => {
              e.stopPropagation();
              hasNext ? handleNavigate('next') : handleDisabledClick();
            }}
            className="cursor-pointer"
          >
            <Button
              variant="ghost"
              size="icon"
              disabled={!hasNext}
              className="h-8 w-8 pointer-events-none"
              asChild
            >
              <div>
                <ChevronRight className="h-5 w-5" />
              </div>
            </Button>
          </div>

          {/* Right Counter - Always show when counters are visible */}
          <AnimatePresence>
            {showCounters && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.3 }}
                className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-gray-500 whitespace-nowrap"
              >
                {vendorsToRight}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Accordion Expansion Content */}
      <AnimatePresence>
        {isExpanded && vendor && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div
              style={{
                borderColor: vendor.color?.hex ?? '#d1d5db'
              }}
              className="mt-2 border-2 rounded-2xl p-4 sm:p-6 bg-white"
            >
              {/* Star Icon Row - Add to Shortlist - Centered and x2 larger */}
              <div className="flex flex-col items-center mb-4">
                <button
                  onClick={handleToggleShortlist}
                  className="p-2 hover:bg-yellow-50 rounded-full transition-colors"
                  title={isShortlisted ? "Remove from shortlist" : "Add to shortlist"}
                >
                  <motion.div
                    animate={isShining ? {
                      scale: [1, 1.3, 1],
                      rotate: [0, 15, -15, 0],
                    } : {}}
                    transition={{ duration: 0.6 }}
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        isShortlisted
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-400 hover:text-yellow-400'
                      } ${isShining ? 'drop-shadow-[0_0_16px_rgba(250,204,21,0.8)]' : ''}`}
                    />
                  </motion.div>
                </button>
                <span className="text-xs text-gray-500 mt-2">Select for outreach</span>
              </div>

              {/* Vendor Name Header - matches desktop */}
              <div className="mb-4 pb-3 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <h3
                    style={{ color: vendor.color?.hex ?? '#111827' }}
                    className="text-lg font-bold"
                  >
                    {vendor.name}
                  </h3>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Handle AI edit for vendor
                      }}
                      className="h-6 w-6 hover:bg-gray-100"
                      title="Edit vendor"
                    >
                      <Bot className="h-3.5 w-3.5 text-gray-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Handle delete vendor
                      }}
                      className="h-6 w-6 hover:bg-red-50"
                      title="Delete vendor"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-gray-500 hover:text-red-500" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    style={{ color: vendor.color?.hex ?? '#111827' }}
                    className="text-sm font-medium"
                  >
                    {vendor.matchPercentage === -1 ? '--' : vendor.matchPercentage}% Match
                  </span>
                  {vendor.website && (
                    <a
                      href={vendor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Visit website
                    </a>
                  )}
                </div>
              </div>

              {/* Executive Summary */}
              {vendor.executiveSummary && (
                <div className="mb-4">
                  <h4
                    style={{ color: vendor.color?.hex ?? '#111827' }}
                    className="text-sm font-semibold mb-2"
                  >
                    About {vendor.name}
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {vendor.executiveSummary}
                  </p>
                </div>
              )}

              {/* Research Insights */}
              {(vendor.killerFeature || (vendor.keyFeatures && vendor.keyFeatures.length > 0)) && (
                <div>
                  <h4
                    style={{ color: vendor.color?.hex ?? '#111827' }}
                    className="text-sm font-semibold mb-2"
                  >
                    Research Insights
                  </h4>
                  {console.log('[VendorCard] Rendering Research Insights for', vendor.name, ':', {
                    killerFeature: vendor.killerFeature,
                    keyFeaturesCount: vendor.keyFeatures?.length,
                    executiveSummary: vendor.executiveSummary
                  })}
                  <ul className="space-y-2">
                    {/* Killer Feature - First bullet with star icon */}
                    {vendor.killerFeature && (
                      <li className="flex items-start gap-2">
                        <span
                          style={{ color: vendor.color?.hex ?? '#6b7280' }}
                          className="text-sm mt-0.5 flex-shrink-0"
                        >
                          ⭐
                        </span>
                        <span className="text-sm text-gray-700 leading-snug font-semibold">
                          {vendor.killerFeature}
                        </span>
                      </li>
                    )}
                    {/* Other key features */}
                    {vendor.keyFeatures?.slice(0, 4).map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span
                          style={{ color: vendor.color?.hex ?? '#6b7280' }}
                          className="text-sm mt-0.5 flex-shrink-0"
                        >
                          •
                        </span>
                        <span className="text-sm text-gray-700 leading-snug">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
