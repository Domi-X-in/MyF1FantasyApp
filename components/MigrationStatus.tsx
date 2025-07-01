"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { MigrationStatusProps } from "@/lib/migration";

export default function MigrationStatus({ isVisible, progress, onClose }: MigrationStatusProps) {
  const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  const isComplete = progress.current === progress.total && progress.total > 0;
  const hasError = progress.message.includes('Error') || progress.message.includes('failed');

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Data Migration
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-blue-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                {/* Progress Text */}
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">
                    {progress.current} of {progress.total} items
                  </p>
                  <p className="text-xs text-gray-500">
                    {percentage}% complete
                  </p>
                </div>

                {/* Status Message */}
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  {isComplete ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : hasError ? (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  ) : (
                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  )}
                  <p className="text-sm text-gray-700">{progress.message}</p>
                </div>

                {/* Action Buttons */}
                {isComplete && (
                  <div className="flex space-x-2">
                    <Button
                      onClick={onClose}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Done
                    </Button>
                  </div>
                )}

                {hasError && (
                  <div className="flex space-x-2">
                    <Button
                      onClick={onClose}
                      variant="outline"
                      className="flex-1"
                    >
                      Close
                    </Button>
                    <Button
                      onClick={onClose}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      Retry
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 