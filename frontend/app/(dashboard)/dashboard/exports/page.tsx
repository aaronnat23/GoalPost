'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, FileCode, FileImage, Calendar } from 'lucide-react';

interface ExportRecord {
  id: string;
  format: 'MD' | 'HTML' | 'DOCX';
  url: string;
  createdAt: string;
  draft: {
    id: string;
    title: string;
  };
  project: {
    id: string;
    name: string;
  };
}

export default function ExportsPage() {
  const [exports, setExports] = useState<ExportRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExports();
  }, []);

  async function fetchExports() {
    try {
      const res = await fetch('/api/exports/history');
      if (res.ok) {
        const data = await res.json();
        setExports(data.exports || []);
      }
    } catch (error) {
      console.error('Failed to fetch exports:', error);
    } finally {
      setLoading(false);
    }
  }

  function getFormatIcon(format: string) {
    switch (format) {
      case 'MD':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'HTML':
        return <FileCode className="w-5 h-5 text-orange-600" />;
      case 'DOCX':
        return <FileImage className="w-5 h-5 text-purple-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  }

  function getFormatBadge(format: string) {
    const colors = {
      MD: 'bg-blue-100 text-blue-700',
      HTML: 'bg-orange-100 text-orange-700',
      DOCX: 'bg-purple-100 text-purple-700',
    };
    return colors[format as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Loading export history...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Export History</h1>
        <p className="text-gray-600">
          Download your exported content in various formats
        </p>
      </div>

      {exports.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No exports yet</p>
          <p className="text-sm text-gray-400">
            Export your drafts from the Content page
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {exports.map((exp) => (
            <Card key={exp.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getFormatIcon(exp.format)}
                  <div>
                    <h3 className="font-semibold">{exp.draft.title || 'Untitled'}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-gray-600">{exp.project.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${getFormatBadge(
                          exp.format
                        )}`}
                      >
                        {exp.format}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(exp.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <Button asChild size="sm">
                  <a href={exp.url} download target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </a>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
