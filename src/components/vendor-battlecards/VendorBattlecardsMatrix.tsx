/**
 * VendorBattlecardsMatrix Component
 * Sprint: SP_023 - Vendor Battlecards
 *
 * Generates AI-powered battlecard comparison table with:
 * - TESTING MODE: 3 mandatory categories only (Target Verticals, Key Customers, Main Integrations)
 * - PRODUCTION MODE: 8-12 total rows (3 mandatory + 5-9 AI-selected dynamic)
 * - Text-based cells with source URLs (not yes/no/star scores)
 * - Row-by-row progressive generation with loading states
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBattlecardsGeneration } from '../../hooks/useBattlecardsGeneration';
import { TechRequest, Vendor as WorkflowVendor, Criteria as WorkflowCriteria } from '../VendorDiscovery';
import { VendorCard } from '../vendor-comparison/VendorCard';
import { DesktopColumnHeader } from '../vendor-comparison/DesktopColumnHeader';
import { ComparisonVendor } from '../../types/comparison.types';
import { Button } from '../ui/button';
import { Play, Pause, RotateCcw, ExternalLink, Loader2, X, ChevronLeft, ChevronRight, Check, Info, RefreshCw, Square } from 'lucide-react';
import { BattlecardsGuidePopup } from './BattlecardsGuidePopup';
import { FormattedBattlecardText } from './FormattedBattlecardText';
import '../../utils/clearBattlecardsCache'; // Make clearAllBattlecardsCache() available in console

interface VendorBattlecardsMatrixProps {
  projectId?: string;
  workflowVendors?: WorkflowVendor[]; // Raw vendors for battlecards generation
  comparisonVendors?: ComparisonVendor[]; // Transformed vendors with colors, match %, summaries
  criteria?: WorkflowCriteria[];
  techRequest?: TechRequest;
  // Shared state from VendorComparisonNew for synchronization
  shortlistedVendorIds?: Set<string>;
  onToggleShortlist?: (vendorId: string) => void;
  onRetryVendor?: (vendorId: string) => void;
  isGeneratingVendorSummaries?: boolean;
}

export const VendorBattlecardsMatrix: React.FC<VendorBattlecardsMatrixProps> = ({
  projectId = '',
  workflowVendors = [],
  comparisonVendors = [],
  criteria = [],
  techRequest = {} as TechRequest,
  shortlistedVendorIds = new Set(),
  onToggleShortlist,
  onRetryVendor,
  isGeneratingVendorSummaries = false,
}) => {
  const {
    battlecardsState,
    isRunning,
    progress,
    startGeneration,
    pauseGeneration,
    resumeGeneration,
    retryRow,
    resetBattlecards,
  } = useBattlecardsGeneration({
    projectId,
    vendors: workflowVendors,
    criteria,
    techRequest,
    autoStart: true, // Auto-start only if no cached data exists
  });

  // Vendor selection state (mobile: 2 vendors, desktop: 3 vendors)
  // Match VendorComparisonNew.tsx initialization pattern
  const [vendor1Index, setVendor1Index] = useState(0);
  const [vendor2Index, setVendor2Index] = useState(Math.min(1, comparisonVendors.length - 1));
  const [vendor3Index, setVendor3Index] = useState(Math.min(2, comparisonVendors.length - 1));

  // Desktop expansion state (for DesktopColumnHeader popover)
  const [expandedColumnIndex, setExpandedColumnIndex] = useState<number | null>(null);

  // Expansion popup state (for battlecard cells)
  const [expandedCell, setExpandedCell] = useState<{
    rowId: string;
    vendorName: string;
    text: string;
    sourceUrls: string[];
    categoryTitle: string;
  } | null>(null);

  // Guide popup state
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // No auto-start - wait for manual user action (Continue or Generate button click)

  // Get current vendors for display - use pre-transformed ComparisonVendor objects
  const vendor1 = comparisonVendors[vendor1Index] || null;
  const vendor2 = comparisonVendors.length >= 2 ? comparisonVendors[vendor2Index] || null : null;
  const vendor3 = comparisonVendors.length >= 3 ? comparisonVendors[vendor3Index] || null : null;

  // Navigation handlers - simple modulo logic like VendorComparisonNew.tsx (NO collision detection)
  const handleVendor1Navigate = (direction: 'next' | 'previous') => {
    setVendor1Index(prev => {
      if (direction === 'next') {
        return (prev + 1) % comparisonVendors.length;
      } else {
        return prev === 0 ? comparisonVendors.length - 1 : prev - 1;
      }
    });
  };

  const handleVendor2Navigate = (direction: 'next' | 'previous') => {
    setVendor2Index(prev => {
      if (direction === 'next') {
        return (prev + 1) % comparisonVendors.length;
      } else {
        return prev === 0 ? comparisonVendors.length - 1 : prev - 1;
      }
    });
  };

  const handleVendor3Navigate = (direction: 'next' | 'previous') => {
    setVendor3Index(prev => {
      if (direction === 'next') {
        return (prev + 1) % comparisonVendors.length;
      } else {
        return prev === 0 ? comparisonVendors.length - 1 : prev - 1;
      }
    });
  };

  // Desktop column toggle handlers (for DesktopColumnHeader popover)
  const handleColumnToggleExpand = (columnIndex: number) => {
    setExpandedColumnIndex(prev => prev === columnIndex ? null : columnIndex);
  };

  // Get visible vendors - simple filter like VendorComparisonNew.tsx (NO deduplication)
  const visibleVendors = [vendor1, vendor2, vendor3].filter((v): v is ComparisonVendor => v !== null);

  if (comparisonVendors.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No vendors available for battlecard comparison.
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header with Title and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Vendor Battlecards
          </h2>
          <p className="text-sm text-gray-600">
            Deep research of key vendor differences including key clients, target verticals and others, with links to evidence.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
          {/* Info button - always visible */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsGuideOpen(true)}
            className="flex-shrink-0"
            title="View battlecards guide"
          >
            <Info className="h-4 w-4" />
          </Button>
          {isRunning ? (
            <Button
              variant="outline"
              onClick={() => {
                pauseGeneration();
              }}
              className="gap-2 border-orange-400 text-orange-600 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-500"
            >
              <Square className="h-4 w-4" />
              Stop Generation
            </Button>
          ) : (
            <>
              {/* Continue button - only show if table has data */}
              {battlecardsState.rows.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (battlecardsState.status === 'paused') {
                      resumeGeneration();
                    } else {
                      startGeneration();
                    }
                  }}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Continue
                </Button>
              )}
              {/* Generate/Regenerate button - text changes based on table data */}
              <Button
                variant="outline"
                onClick={() => {
                  // Clear battlecards cache
                  if (projectId && workflowVendors.length > 0) {
                    const vendorNames = workflowVendors.map(v => v.name).sort().join(',');
                    const cacheKey = `battlecards_${projectId}_${vendorNames}`;
                    localStorage.removeItem(cacheKey);
                  }
                  // Reset and let auto-start handle regeneration
                  resetBattlecards();
                }}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                {battlecardsState.rows.length > 0 ? 'Regenerate' : 'Generate'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Vendor Selector Cards (Mobile & Desktop) */}
      {comparisonVendors.length > 0 && (
        <>
          {/* Mobile: Stacked Vertically (< lg) */}
          <div className="lg:hidden mb-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-3"
            >
              {/* Vendor 1 Card */}
              {vendor1 && (
                <VendorCard
                  key="mobile-vendor1"
                  vendor={vendor1}
                  currentIndex={vendor1Index}
                  totalVendors={comparisonVendors.length}
                  onNavigate={handleVendor1Navigate}
                  isShortlisted={shortlistedVendorIds.has(vendor1.id)}
                  onToggleShortlist={onToggleShortlist}
                  onRetryVendor={onRetryVendor}
                  isLoadingSummary={isGeneratingVendorSummaries && !vendor1.executiveSummary && !vendor1.killerFeature}
                />
              )}

              {/* Vendor 2 Card (only show if 2+ vendors) */}
              {comparisonVendors.length >= 2 && vendor2 && (
                <VendorCard
                  key="mobile-vendor2"
                  vendor={vendor2}
                  currentIndex={vendor2Index}
                  totalVendors={comparisonVendors.length}
                  onNavigate={handleVendor2Navigate}
                  isShortlisted={shortlistedVendorIds.has(vendor2.id)}
                  onToggleShortlist={onToggleShortlist}
                  onRetryVendor={onRetryVendor}
                  isLoadingSummary={isGeneratingVendorSummaries && !vendor2.executiveSummary && !vendor2.killerFeature}
                />
              )}
            </motion.div>
          </div>

          {/* Desktop: Popover expansion (≥ lg) - matches comparison matrix */}
          <div className="hidden lg:block mb-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-3 gap-4"
            >
              {/* Vendor 1 Column */}
              {vendor1 && (
                <DesktopColumnHeader
                  key="desktop-vendor1"
                  vendor={vendor1}
                  currentIndex={vendor1Index}
                  totalVendors={comparisonVendors.length}
                  onNavigate={handleVendor1Navigate}
                  isExpanded={expandedColumnIndex === 0}
                  onToggleExpand={() => handleColumnToggleExpand(0)}
                  columnPosition={0}
                  isShortlisted={shortlistedVendorIds.has(vendor1.id)}
                  onToggleShortlist={onToggleShortlist}
                  isLoadingSummary={isGeneratingVendorSummaries && !vendor1.executiveSummary && !vendor1.killerFeature}
                />
              )}

              {/* Vendor 2 Column */}
              {comparisonVendors.length >= 2 && vendor2 && (
                <DesktopColumnHeader
                  key="desktop-vendor2"
                  vendor={vendor2}
                  currentIndex={vendor2Index}
                  totalVendors={comparisonVendors.length}
                  onNavigate={handleVendor2Navigate}
                  isExpanded={expandedColumnIndex === 1}
                  onToggleExpand={() => handleColumnToggleExpand(1)}
                  columnPosition={1}
                  isShortlisted={shortlistedVendorIds.has(vendor2.id)}
                  onToggleShortlist={onToggleShortlist}
                  isLoadingSummary={isGeneratingVendorSummaries && !vendor2.executiveSummary && !vendor2.killerFeature}
                />
              )}

              {/* Vendor 3 Column */}
              {comparisonVendors.length >= 3 && vendor3 && (
                <DesktopColumnHeader
                  key="desktop-vendor3"
                  vendor={vendor3}
                  currentIndex={vendor3Index}
                  totalVendors={comparisonVendors.length}
                  onNavigate={handleVendor3Navigate}
                  isExpanded={expandedColumnIndex === 2}
                  onToggleExpand={() => handleColumnToggleExpand(2)}
                  columnPosition={2}
                  isShortlisted={shortlistedVendorIds.has(vendor3.id)}
                  onToggleShortlist={onToggleShortlist}
                  isLoadingSummary={isGeneratingVendorSummaries && !vendor3.executiveSummary && !vendor3.killerFeature}
                />
              )}
            </motion.div>
          </div>
        </>
      )}

      {/* Battlecard Rows */}
      <div className="space-y-6">
        {battlecardsState.rows.map((row, rowIndex) => (
          <motion.div
            key={row.row_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: rowIndex * 0.1 }}
            className={`border-2 rounded-lg overflow-hidden bg-white ${
              row.status === 'completed' ? 'border-green-200' :
              row.status === 'failed' ? 'border-red-200' :
              row.status === 'loading' ? 'border-blue-200' :
              'border-gray-200'
            }`}
          >
            {/* Row Header */}
            <div className="px-6 py-4 bg-white border-b border-gray-200 relative">
              {/* Status indicator - Top Right */}
              <div className="absolute top-4 right-6">
                {row.status === 'completed' && (
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
                {row.status === 'loading' && (
                  <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                    <Loader2 className="h-3 w-3 text-white animate-spin" />
                  </div>
                )}
                {row.status === 'failed' && (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-200 text-red-800">
                      failed
                    </span>
                    {row.retry_count < 3 && (
                      <Button
                        onClick={() => retryRow(row.row_id)}
                        size="sm"
                        variant="outline"
                        className="text-xs"
                      >
                        Retry ({row.retry_count}/3)
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="pr-10">
                <h3 className="text-sm xs:text-base sm:text-lg md:text-xl font-semibold text-gray-900">{row.category_title}</h3>
                {row.category_definition && (
                  <p className="text-xs xs:text-sm text-gray-600 mt-1">{row.category_definition}</p>
                )}
              </div>

              {row.error && (
                <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded text-sm text-red-800">
                  <span className="font-semibold">Error:</span> {row.error}
                  {row.error_code && <span className="ml-2 text-xs">({row.error_code})</span>}
                </div>
              )}
            </div>

            {/* Vendor Cells (for visible vendors only) */}
            {row.cells.length > 0 && (
              <>
                {/* Mobile: 2 columns (< lg) */}
                <div className="lg:hidden grid grid-cols-2 gap-4 p-4 sm:p-6">
                  {visibleVendors.slice(0, 2).map((vendor, index) => {
                    const cell = row.cells.find((c) => c.vendor_name === vendor.name);
                    return (
                      <div
                        key={`${row.row_id}_${index}`}
                        onClick={() => {
                          if (cell) {
                            setExpandedCell({
                              rowId: row.row_id,
                              vendorName: cell.vendor_name,
                              text: cell.text,
                              sourceUrls: cell.source_urls || [],
                              categoryTitle: row.category_title,
                            });
                          }
                        }}
                        className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer max-h-[182px] sm:max-h-[208px] overflow-hidden group"
                      >
                        <h4
                          className="font-semibold mb-1.5 text-sm xs:text-base sm:text-base truncate group-hover:opacity-80 transition-colors"
                          style={{ color: vendor.color.hex }}
                        >
                          {cell?.vendor_name || vendor.name}
                        </h4>
                        {cell ? (
                          <>
                            <FormattedBattlecardText
                              text={cell.text}
                              className="text-[8px] xs:text-[9px] sm:text-xs text-gray-700 leading-relaxed whitespace-pre-line line-clamp-4 sm:line-clamp-5"
                            />
                            {cell.source_urls && cell.source_urls.length > 0 && (
                              <div className="mt-2 text-[8px] xs:text-[9px] text-blue-600 font-medium">
                                {cell.source_urls.length} source{cell.source_urls.length > 1 ? 's' : ''}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-[8px] xs:text-[9px] sm:text-xs text-gray-400 italic">
                            {/* Empty - loading */}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Desktop: 3 columns (≥ lg) */}
                <div className="hidden lg:grid grid-cols-3 gap-4 p-4 sm:p-6">
                  {visibleVendors.map((vendor, index) => {
                    const cell = row.cells.find((c) => c.vendor_name === vendor.name);
                    return (
                      <div
                        key={`${row.row_id}_${index}`}
                        onClick={() => {
                          if (cell) {
                            setExpandedCell({
                              rowId: row.row_id,
                              vendorName: cell.vendor_name,
                              text: cell.text,
                              sourceUrls: cell.source_urls || [],
                              categoryTitle: row.category_title,
                            });
                          }
                        }}
                        className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer max-h-[182px] sm:max-h-[208px] overflow-hidden group"
                      >
                        <h4
                          className="font-semibold mb-1.5 text-sm xs:text-base sm:text-base truncate group-hover:opacity-80 transition-colors"
                          style={{ color: vendor.color.hex }}
                        >
                          {cell?.vendor_name || vendor.name}
                        </h4>
                        {cell ? (
                          <>
                            <FormattedBattlecardText
                              text={cell.text}
                              className="text-[8px] xs:text-[9px] sm:text-xs text-gray-700 leading-relaxed whitespace-pre-line line-clamp-4 sm:line-clamp-5"
                            />
                            {cell.source_urls && cell.source_urls.length > 0 && (
                              <div className="mt-2 text-[8px] xs:text-[9px] text-blue-600 font-medium">
                                {cell.source_urls.length} source{cell.source_urls.length > 1 ? 's' : ''}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-[8px] xs:text-[9px] sm:text-xs text-gray-400 italic">
                            {/* Empty - loading */}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Loading State - Show skeleton/ghost text */}
            {row.status === 'loading' && row.cells.length === 0 && (
              <>
                {/* Mobile: 2 columns (< lg) */}
                <div className="lg:hidden grid grid-cols-2 gap-4 p-4 sm:p-6">
                  {visibleVendors.slice(0, 2).map((vendor, index) => (
                    <div
                      key={`${row.row_id}_loading_${index}`}
                      className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 max-h-[182px] sm:max-h-[208px]"
                    >
                      <h4
                        className="font-semibold mb-1.5 text-sm xs:text-base sm:text-base truncate"
                        style={{ color: vendor.color.hex }}
                      >
                        {vendor.name}
                      </h4>
                      <div className="space-y-2 animate-pulse">
                        <div className="h-2 bg-gray-200 rounded w-full"></div>
                        <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                        <div className="h-2 bg-gray-200 rounded w-4/6"></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop: 3 columns (≥ lg) */}
                <div className="hidden lg:grid grid-cols-3 gap-4 p-4 sm:p-6">
                  {visibleVendors.map((vendor, index) => (
                    <div
                      key={`${row.row_id}_loading_${index}`}
                      className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 max-h-[182px] sm:max-h-[208px]"
                    >
                      <h4
                        className="font-semibold mb-1.5 text-sm xs:text-base sm:text-base truncate"
                        style={{ color: vendor.color.hex }}
                      >
                        {vendor.name}
                      </h4>
                      <div className="space-y-2 animate-pulse">
                        <div className="h-2 bg-gray-200 rounded w-full"></div>
                        <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                        <div className="h-2 bg-gray-200 rounded w-4/6"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Pending State */}
            {row.status === 'pending' && row.cells.length === 0 && (
              <div className="p-6 text-center">
                <div className="inline-flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-gray-400" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-3">Waiting to start...</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {battlecardsState.rows.length === 0 && !isRunning && battlecardsState.status === 'idle' && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">No battlecard rows available.</p>
        </div>
      )}

      {/* Cell Detail Expansion Popup */}
      <AnimatePresence>
        {expandedCell && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setExpandedCell(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {expandedCell.vendorName}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {expandedCell.categoryTitle}
                  </p>
                </div>
                <button
                  onClick={() => setExpandedCell(null)}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Full Text Content */}
              <div className="mb-6">
                <FormattedBattlecardText
                  text={expandedCell.text}
                  className="text-sm text-gray-700 leading-relaxed whitespace-pre-line"
                />
              </div>

              {/* Source Links */}
              {expandedCell.sourceUrls && expandedCell.sourceUrls.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Sources ({expandedCell.sourceUrls.length})
                  </h4>
                  <div className="space-y-2">
                    {expandedCell.sourceUrls.map((url, urlIndex) => (
                      <a
                        key={urlIndex}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        <ExternalLink className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{url}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Battlecards Guide Popup */}
      <BattlecardsGuidePopup
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

    </div>
  );
};
