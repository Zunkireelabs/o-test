'use client';

import { useAppStore } from '@/stores/app-store';
import { NewTaskSection } from './new-task-section';
import { IngestSection } from './ingest-section';
import { JobsSection } from './jobs-section';
import { KnowledgeSection } from './knowledge-section';
import { WidgetConfigSection } from './widget-config-section';
import { EmbedSection } from './embed-section';
import { ConnectorsSection } from './connectors-section';
import { ProfileSection } from './profile-section';
import { motion, AnimatePresence } from 'framer-motion';

export function DashboardContent() {
  const { currentSection } = useAppStore();

  const renderSection = () => {
    switch (currentSection) {
      case 'newtask':
        return <NewTaskSection />;
      case 'ingest':
        return <IngestSection />;
      case 'jobs':
        return <JobsSection />;
      case 'knowledge':
        return <KnowledgeSection />;
      case 'widget':
        return <WidgetConfigSection />;
      case 'embed':
        return <EmbedSection />;
      case 'connectors':
        return <ConnectorsSection />;
      case 'profile':
        return <ProfileSection />;
      default:
        return <NewTaskSection />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentSection}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.15 }}
      >
        {renderSection()}
      </motion.div>
    </AnimatePresence>
  );
}
