/**
 * BattlecardsColumnHeader Component
 * Sprint: SP_015 (Desktop Enhancement)
 *
 * Column header for desktop view (≥768px) showing:
 * - Vendor name and match percentage
 * - Navigation arrows to cycle vendors in that column
 * - T-shaped expansion (upward) for vendor details
 * - Placeholder for adding vendors when slot is empty
 */

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Bot, Trash2, Info, Star, Loader2 } from 'lucide-react';
import { ComparisonVendor } from '../../types/comparison.types';
import { Button } from '../ui/button';
import { useToast } from '../../hooks/use-toast';

interface BattlecardsColumnHeaderProps {
  vendor: ComparisonVendor | null;
  currentIndex: number;
  totalVendors: number;
  onNavigate: (direction: 'next' | 'previous') => void;
  onAddVendor?: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  className?: string;
  columnPosition?: number; // 0-4 for 5 columns, used for popover positioning
  isShortlisted?: boolean;
  onToggleShortlist?: (vendorId: string) => void;
  isLoadingSummary?: boolean;
}

export const BattlecardsColumnHeader: React.FC<BattlecardsColumnHeaderProps> = ({
  vendor,
  currentIndex,
  totalVendors,
  onNavigate,
  onAddVendor,
  isExpanded,
  onToggleExpand,
  className = '',
  columnPosition = 0,
  isShortlisted = false,
  onToggleShortlist,
  isLoadingSummary = false,
}) => {
  const { toast } = useToast();
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < totalVendors - 1;
  const popoverRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLButtonElement>(null);

  // Star shine animation state
  const [isShining, setIsShining] = useState(false);

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

  // Determine popover alignment based on column position
  // Left columns (0-1): align left, Center column (2): center, Right columns (3-4): align right
  const getPopoverPositionClass = () => {
    if (columnPosition <= 1) {
      return 'left-0'; // Align to left edge
    } else if (columnPosition >= 3) {
      return 'right-0'; // Align to right edge
    } else {
      return 'left-1/2 -translate-x-1/2'; // Center
    }
  };

  // Click outside to close popover
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        cardRef.current &&
        !cardRef.current.contains(target)
      ) {
        onToggleExpand();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded, onToggleExpand]);

  // Placeholder card when no vendor
  if (!vendor) {
    return (
      <div className={`desktop-column-header ${className}`}>
        <div className="flex flex-col items-center">
          {/* Empty space for top arrow */}
          <div className="h-5" />

          {/* Placeholder card */}
          <button
            onClick={onAddVendor}
            className="w-full min-h-[60px] border-2 border-dashed border-gray-300 rounded-xl bg-white hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary group"
          >
            <Plus className="h-4 w-4 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium">Add Vendor</span>
          </button>

          {/* Empty space for bottom arrow */}
          <div className="h-5" />
        </div>
      </div>
    );
  }

  return (
    <div className={`desktop-column-header relative ${className}`}>
      {/* Vertical layout: arrow - card - arrow */}
      <div className="flex flex-col items-center">
        {/* Top Arrow (Previous) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate('previous')}
          disabled={!hasPrevious}
          className="h-5 w-5 p-0"
        >
          <ChevronLeft className="h-3 w-3 rotate-90" />
        </Button>

        {/* Vendor Card - Clickable for expansion */}
        <motion.button
          ref={cardRef}
          onClick={onToggleExpand}
          style={{
            borderColor: vendor.color?.hex ?? '#d1d5db',
          }}
          className={`w-full border-2 rounded-xl px-2 py-2 min-h-[60px] transition-all hover:shadow-md bg-white ${
            isExpanded ? 'ring-2 ring-offset-1' : ''
          } relative`}
          whileTap={{ scale: 0.98 }}
        >
          {/* Info Icon - Top Right */}
          <div className="absolute top-1 right-1">
            <Info className="h-3 w-3 text-gray-400" />
          </div>

          <div className="flex items-center gap-2 w-full">
            {/* Company Logo */}
            {vendor.website && (
              <img
                src={`https://img.logo.dev/${vendor.website.replace(/^https?:\/\//, '').split('/')[0]}?token=pk_Fvbs8Zl6SWiC5WEoP8Qzbg`}
                alt={`${vendor.name} logo`}
                className="w-8 h-8 rounded-md object-contain flex-shrink-0 bg-white"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <div className="text-left min-w-0 flex-1">
              <div
                style={{ color: vendor.color?.hex ?? '#111827' }}
                className="font-semibold text-sm truncate hidden xl:block"
              >
                {vendor.name}
              </div>
              <div
                style={{ color: vendor.color?.hex ?? '#111827' }}
                className="text-xs opacity-80 xl:mt-0.5"
              >
                {vendor.matchPercentage === -1 ? '--' : vendor.matchPercentage}%
              </div>
            </div>
          </div>
        </motion.button>

        {/* Bottom Arrow (Next) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate('next')}
          disabled={!hasNext}
          className="h-5 w-5 p-0"
        >
          <ChevronRight className="h-3 w-3 rotate-90" />
        </Button>
      </div>

      {/* Popover - appears below the card */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`absolute top-full ${getPopoverPositionClass()} mt-2 z-[100] w-72 sm:w-80 lg:w-96`}
          >
            <div
              style={{
                borderColor: vendor.color?.hex ?? '#d1d5db',
              }}
              className="border-2 rounded-xl p-5 sm:p-6 shadow-xl bg-white"
            >
              {/* Star Icon Row - Add to Shortlist - Centered */}
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

              {/* Vendor Name Header */}
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

              {/* Loading State for Vendor Summary */}
              {isLoadingSummary && !vendor.executiveSummary && !vendor.killerFeature && (
                <div className="flex flex-col items-center justify-center py-8 px-4">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-3" />
                  <p className="text-sm text-gray-500 font-medium">Researching...</p>
                </div>
              )}

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
