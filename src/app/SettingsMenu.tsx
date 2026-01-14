'use client';

import { useState, useRef, useEffect } from 'react';
import { IconSettings, IconFileDownload, IconRefresh } from '@tabler/icons-react';

export function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleExportCSV = async () => {
    setIsOpen(false);
    try {
      const response = await fetch('/api/export-csv');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diesel-tracker-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handleSync = () => {
    setIsOpen(false);
    // Force a hard reload
    window.location.reload();
  };

  return (
    <div className="settingsMenu" ref={menuRef}>
      <button
        className="settingsBtn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Settings"
        aria-expanded={isOpen}
      >
        <IconSettings size={20} stroke={1.5} />
      </button>
      
      {isOpen && (
        <div className="settingsDropdown">
          <button className="settingsItem" onClick={handleExportCSV}>
            <IconFileDownload size={18} stroke={1.5} />
            Export to CSV
          </button>
          <button className="settingsItem" onClick={handleSync}>
            <IconRefresh size={18} stroke={1.5} />
            Sync Application
          </button>
        </div>
      )}
    </div>
  );
}
