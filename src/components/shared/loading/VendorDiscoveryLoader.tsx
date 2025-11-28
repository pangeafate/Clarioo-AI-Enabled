import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';

// Mock vendors for the animation - 10 arbitrary well-known vendors
const MOCK_VENDORS = [
  { name: 'Salesforce', website: 'salesforce.com' },
  { name: 'HubSpot', website: 'hubspot.com' },
  { name: 'Zendesk', website: 'zendesk.com' },
  { name: 'Freshworks', website: 'freshworks.com' },
  { name: 'Pipedrive', website: 'pipedrive.com' },
  { name: 'Monday.com', website: 'monday.com' },
  { name: 'Zoho', website: 'zoho.com' },
  { name: 'Intercom', website: 'intercom.com' },
  { name: 'Slack', website: 'slack.com' },
  { name: 'Notion', website: 'notion.so' },
];

interface OrbitingVendor {
  id: string;
  name: string;
  website: string;
  startAngle: number;
  duration: number; // seconds for full orbit
}

interface VendorDiscoveryLoaderProps {
  message?: string;
  description?: string;
  className?: string;
}

export const VendorDiscoveryLoader: React.FC<VendorDiscoveryLoaderProps> = ({
  message = 'Discovering vendors...',
  description,
  className = '',
}) => {
  const [orbitingVendors, setOrbitingVendors] = useState<OrbitingVendor[]>([]);
  const usedVendorsRef = useRef<Set<string>>(new Set());

  // Add a new vendor to the orbit
  useEffect(() => {
    const addVendor = () => {
      // Find available vendors
      const availableVendors = MOCK_VENDORS.filter(
        mv => !usedVendorsRef.current.has(mv.website)
      );

      if (availableVendors.length === 0) {
        // Reset if all used
        usedVendorsRef.current.clear();
        return;
      }

      const randomVendor = availableVendors[Math.floor(Math.random() * availableVendors.length)];
      usedVendorsRef.current.add(randomVendor.website);

      const newVendor: OrbitingVendor = {
        id: `${randomVendor.website}-${Date.now()}`,
        name: randomVendor.name,
        website: randomVendor.website,
        startAngle: Math.random() * 360,
        duration: 6 + Math.random() * 4, // 6-10 seconds for full orbit
      };

      setOrbitingVendors(prev => [...prev, newVendor]);

      // Remove this vendor after 2.5-4 seconds
      setTimeout(() => {
        setOrbitingVendors(prev => prev.filter(v => v.id !== newVendor.id));
        usedVendorsRef.current.delete(randomVendor.website);
      }, 2500 + Math.random() * 1500);
    };

    // Initial vendors with stagger
    const t1 = setTimeout(() => addVendor(), 100);
    const t2 = setTimeout(() => addVendor(), 400);
    const t3 = setTimeout(() => addVendor(), 700);

    // Continue adding vendors
    const interval = setInterval(() => {
      setOrbitingVendors(prev => {
        if (prev.length < 4) {
          addVendor();
        }
        return prev;
      });
    }, 1000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
      {/* Orbiting Container */}
      <div className="relative w-[300px] h-[300px] mb-6">
        {/* Central Search Icon with Ripples */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center">
          {/* Ripple effects */}
          <motion.div
            animate={{
              scale: [1, 3],
              opacity: [0.3, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeOut',
              repeatDelay: 0.3,
            }}
            className="absolute w-10 h-10 rounded-full border border-primary/50"
          />
          <motion.div
            animate={{
              scale: [1, 3],
              opacity: [0.3, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeOut',
              delay: 0.8,
              repeatDelay: 0.3,
            }}
            className="absolute w-10 h-10 rounded-full border border-primary/50"
          />
          <motion.div
            animate={{
              scale: [1, 3],
              opacity: [0.3, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeOut',
              delay: 1.6,
              repeatDelay: 0.3,
            }}
            className="absolute w-10 h-10 rounded-full border border-primary/50"
          />

          {/* Icon */}
          <Search className="h-10 w-10 text-primary relative" />
        </div>

        {/* Orbit Path - Visual Guide */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] border border-dashed border-gray-200 rounded-full opacity-50" />

        {/* Orbiting Vendors */}
        <AnimatePresence>
          {orbitingVendors.map(vendor => (
            <motion.div
              key={vendor.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: 1,
                scale: 1,
                rotate: [vendor.startAngle, vendor.startAngle + 360]
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{
                opacity: { duration: 0.4 },
                scale: { duration: 0.4 },
                rotate: {
                  duration: vendor.duration,
                  repeat: Infinity,
                  ease: 'linear'
                }
              }}
              className="absolute top-1/2 left-1/2 w-0 h-0"
              style={{ transformOrigin: '0 0' }}
            >
              {/* Offset container to position on orbit */}
              <div
                className="absolute flex flex-col items-center gap-1"
                style={{
                  transform: 'translate(-50%, -50%) translateY(-110px)',
                }}
              >
                {/* Counter-rotate to keep logo upright */}
                <motion.div
                  animate={{ rotate: [-(vendor.startAngle), -(vendor.startAngle + 360)] }}
                  transition={{
                    duration: vendor.duration,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                  className="flex flex-col items-center gap-1"
                >
                  {/* Logo */}
                  <div className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center p-1.5">
                    <img
                      src={`https://img.logo.dev/${vendor.website}?token=pk_Fvbs8Zl6SWiC5WEoP8Qzbg`}
                      alt={vendor.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${vendor.name}&background=f3f4f6&color=6366f1&size=40`;
                      }}
                    />
                  </div>
                  {/* Evaluating indicator */}
                  <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm">
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-1.5 h-1.5 bg-primary rounded-full"
                    />
                    <span className="text-[10px] text-gray-500 font-medium whitespace-nowrap">Evaluating</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Text */}
      <div className="flex flex-col items-center gap-2 text-center">
        <motion.h3
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-xl font-semibold text-foreground"
        >
          {message}
        </motion.h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-md">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};
