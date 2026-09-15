import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Upload,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  EyeOff,
  Trash2,
  Edit2,
  Plus,
  RefreshCw,
  Info,
  Clock,
  Archive
} from 'lucide-react';
import { CourseMaterial } from '../../types';

export const MaterialsManager: React.FC = () => {
  const {
    activeCourse,
    currentUser,
    materials,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    toggleApproveForAI
  } = useApp();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadTopic, setUploadTopic] = useState(activeCourse.currentTopic);
  const [uploadWeek, setUploadWeek] = useState(activeCourse.currentWeek);
  const [isDragOver, setIsDragOver] = useState(false);

  // Edit modal
  const [editingMat, setEditingMat] = useState<CourseMaterial | null>(null);

  const courseMaterials = materials.filter((m) => m.courseId === activeCourse.id);

  const handleSimulatedUpload = async (filename?: string) => {
    const fname = filename || (uploadTitle ? `${uploadTitle.replace(/\s+/g, '_')}.pdf` : 'Lecture_Material.pdf');
    setIsUploading(true);

    await addMaterial({
      title: uploadTitle || fname.replace('.pdf', ''),
      filename: fname,
      fileSize: '3.4 MB',
      topic: uploadTopic,
      week: Number(uploadWeek),
      studentVisible: true,
      contentSnippet: `Extracted lecture slides covering ${uploadTopic}. Includes code examples, definitions, and review questions.`
    });

    setIsUploading(false);
    setUploadTitle('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleSimulatedUpload(file.name);
    }
  };

  const isTA = currentUser.role === 'ta';

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E5E8EB] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs">
            <span className="px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-[#183059] border border-blue-200">
              {activeCourse.code} Materials
            </span>
            <span className="text-[#656D76] font-medium">Authoritative Knowledge Repository</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1F2328] tracking-tight">
            Course Sources & Certified AI Indexing
          </h1>
          <p className="text-xs text-[#656D76] mt-1 max-w-2xl">
            Manage certified lecture notes, slide decks, and lab handouts. Only materials marked as <strong>"Approved for AI"</strong> ground student responses and question banks.
          </p>
        </div>

        {/* Status Callout */}
        <div className="flex items-center gap-3">
          <div className="bg-[#F8F9FC] rounded-2xl p-3.5 border border-[#E5E8EB] text-right">
            <div className="text-[11px] text-[#656D76] font-medium">Official Grounding Sources</div>
            <div className="text-sm font-bold text-[#1F2328] flex items-center justify-end gap-1.5 mt-0.5">
              <ShieldCheck className="w-4 h-4 text-[#183059]" />
              {courseMaterials.filter((m) => m.approvedForAI).length} / {courseMaterials.length} Active
            </div>
          </div>
        </div>
      </div>

      {/* Modern High-Level Metrics Cards (Matching Image 1 dashboard archetype) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#E5E8EB] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#183059] border border-blue-200 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#656D76] font-medium">Total Documents</div>
            <div className="text-2xl font-bold text-[#1F2328] tracking-tight">{courseMaterials.length}</div>
            <div className="text-[11px] text-[#183059] font-semibold">100% indexed in vector DB</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E5E8EB] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#183059] border border-blue-200 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#656D76] font-medium">Approved for AI</div>
            <div className="text-2xl font-bold text-[#183059] tracking-tight">
              {courseMaterials.filter((m) => m.approvedForAI).length}
            </div>
            <div className="text-[11px] text-[#656D76]">Authoritative ground truth</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E5E8EB] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#183059] border border-blue-200 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#656D76] font-medium">Extracted Chunks</div>
            <div className="text-2xl font-bold text-[#1F2328] tracking-tight">
              {courseMaterials.reduce((acc, m) => acc + (m.extractedSectionsCount || 0), 0)}
            </div>
            <div className="text-[11px] text-[#183059] font-semibold">Granular claim citations</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E5E8EB] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#C8102E] border border-red-200 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#656D76] font-medium">Requires Review</div>
            <div className="text-2xl font-bold text-[#C8102E] tracking-tight">
              {courseMaterials.filter((m) => !m.approvedForAI).length}
            </div>
            <div className="text-[11px] text-[#C8102E] font-medium">Unapproved draft documents</div>
          </div>
        </div>
      </div>

      {/* Role permission alert for TAs */}
      {isTA && (
        <div className="bg-red-50/60 rounded-2xl p-4 border border-red-200 text-xs text-[#C8102E] flex items-start gap-3">
          <Info className="w-4 h-4 text-[#C8102E] mt-0.5 shrink-0" />
          <div>
            <span className="font-bold">Delegated Teaching Assistant Role (Alex Le)</span>
            <p className="text-[#24292F] text-[11px] mt-0.5">
              You can upload draft materials and edit metadata. Marking materials as <strong>"Approved for AI"</strong> requires final approval from Course Lead <strong>Prof. David Miller</strong> to protect academic syllabus authority.
            </p>
          </div>
        </div>
      )}

      {/* Upload Zone (Drag & Drop + Manual) */}
      <div
        id="materials-upload-zone"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`bg-white rounded-2xl p-6 sm:p-7 border-2 border-dashed transition-all ${
          isDragOver
            ? 'border-[#183059] bg-blue-50/30'
            : 'border-[#E5E8EB] hover:border-[#183059]'
        }`}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#183059] border border-blue-200 flex items-center justify-center shrink-0">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1F2328]">Upload Learning Materials</h3>
              <p className="text-xs text-[#656D76] mt-0.5">
                Drag and drop PDF slide decks, textbook excerpts, or lab guides (Max 25MB)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <input
              type="text"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="Material Title (e.g. Lecture 6: Paging)"
              className="rounded-xl border border-[#E5E8EB] bg-[#F8F9FC] px-3.5 py-2.5 text-xs text-[#1F2328] placeholder:text-[#656D76] focus:bg-white focus:ring-2 focus:ring-[#183059] w-full sm:w-64"
            />
            <button
              id="upload-material-btn"
              onClick={() => handleSimulatedUpload()}
              disabled={isUploading}
              className="px-5 py-2.5 rounded-xl bg-[#183059] hover:bg-[#0E1F3B] text-white font-bold text-xs transition-colors shadow-2xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Processing & Extracting...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add to Course
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Materials Table & Processing Pipeline */}
      <div className="bg-white rounded-2xl border border-[#E5E8EB] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#F0F2F5] flex items-center justify-between bg-[#F8F9FC]">
          <h3 className="text-sm font-bold text-[#1F2328]">
            Course Source Index ({courseMaterials.length} Documents)
          </h3>
          <span className="text-xs text-[#656D76]">
            Click status toggle to change AI accessibility
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5E8EB] text-[#656D76] font-semibold bg-[#F8F9FC]">
                <th className="py-3 px-4">Document Title & Filename</th>
                <th className="py-3 px-4">Topic / Week</th>
                <th className="py-3 px-4">Extraction Status</th>
                <th className="py-3 px-4">Student Visible</th>
                <th className="py-3 px-4">Approved for AI</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F2F5]">
              {courseMaterials.map((mat) => (
                <tr key={mat.id} className="hover:bg-[#F8F9FC] transition-colors">
                  {/* Title */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#1F2328] flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#656D76] shrink-0" />
                      <span>{mat.title}</span>
                    </div>
                    <div className="text-[11px] text-[#656D76] font-mono mt-0.5">
                      {mat.filename} • {mat.fileSize} • v{mat.version}
                    </div>
                  </td>

                  {/* Topic / Week */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#1F2328]">{mat.topic}</div>
                    <div className="text-[11px] text-[#656D76]">Week {mat.week}</div>
                  </td>

                  {/* Extraction Pipeline Status */}
                  <td className="py-3 px-4">
                    {mat.status === 'approved' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-[#183059] border border-blue-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {mat.extractedSectionsCount} Sections Extracted
                      </span>
                    )}
                    {mat.status === 'draft' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F8F9FC] text-[#656D76] border border-[#E5E8EB]">
                        <Clock className="w-3.5 h-3.5" />
                        Draft (Unpublished)
                      </span>
                    )}
                    {mat.status === 'processing' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-[#183059] border border-blue-200 animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Extracting text...
                      </span>
                    )}
                    {mat.status === 'warning' && (
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-[#C8102E] border border-red-200 cursor-help"
                        title={mat.statusMessage}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Extraction Warning
                      </span>
                    )}
                  </td>

                  {/* Student Visible */}
                  <td className="py-3 px-4">
                    <button
                      onClick={() =>
                        updateMaterial(mat.id, { studentVisible: !mat.studentVisible })
                      }
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-semibold transition-colors ${
                        mat.studentVisible
                          ? 'bg-blue-50 text-[#183059] border border-blue-200'
                          : 'bg-[#F8F9FC] text-[#656D76] border border-[#E5E8EB]'
                      }`}
                    >
                      {mat.studentVisible ? (
                        <>
                          <Eye className="w-3 h-3" /> Visible
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" /> Hidden
                        </>
                      )}
                    </button>
                  </td>

                  {/* Approved for AI */}
                  <td className="py-3 px-4">
                    <button
                      id={`toggle-ai-approval-${mat.id}-btn`}
                      onClick={() => toggleApproveForAI(mat.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                        mat.approvedForAI
                          ? 'bg-[#183059] hover:bg-[#0E1F3B] text-white shadow-2xs'
                          : 'bg-[#F8F9FC] text-[#656D76] border border-[#E5E8EB] hover:bg-white'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{mat.approvedForAI ? 'Approved' : 'Not Approved'}</span>
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingMat(mat)}
                        className="p-1.5 rounded-xl text-[#656D76] hover:text-[#1F2328] hover:bg-[#F8F9FC]"
                        title="Edit metadata"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteMaterial(mat.id)}
                        className="p-1.5 rounded-xl text-[#656D76] hover:text-[#C8102E] hover:bg-red-50"
                        title="Remove source"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Metadata Modal */}
      {editingMat && (
        <div className="fixed inset-0 z-50 bg-[#0E1F3B]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-[#E5E8EB] text-xs space-y-4">
            <h3 className="text-sm font-bold text-[#1F2328]">Edit Source Metadata</h3>

            <div>
              <label className="block font-bold text-[#1F2328] mb-1">Title</label>
              <input
                type="text"
                value={editingMat.title}
                onChange={(e) => setEditingMat({ ...editingMat, title: e.target.value })}
                className="w-full rounded-xl border border-[#E5E8EB] bg-white p-2.5 text-xs text-[#1F2328]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#1F2328] mb-1">Topic</label>
                <input
                  type="text"
                  value={editingMat.topic}
                  onChange={(e) => setEditingMat({ ...editingMat, topic: e.target.value })}
                  className="w-full rounded-md border border-[#D0D7DE] bg-white p-2.5 text-xs text-[#1F2328]"
                />
              </div>
              <div>
                <label className="block font-bold text-[#1F2328] mb-1">Week Number</label>
                <input
                  type="number"
                  value={editingMat.week}
                  onChange={(e) => setEditingMat({ ...editingMat, week: Number(e.target.value) })}
                  className="w-full rounded-md border border-[#D0D7DE] bg-white p-2.5 text-xs text-[#1F2328]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#D0D7DE]">
              <button
                type="button"
                onClick={() => setEditingMat(null)}
                className="px-3 py-1.5 rounded-md border border-[#D0D7DE] bg-white hover:bg-[#F6F8FA] text-[#24292F] font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  updateMaterial(editingMat.id, {
                    title: editingMat.title,
                    topic: editingMat.topic,
                    week: editingMat.week
                  });
                  setEditingMat(null);
                }}
                className="px-4 py-1.5 rounded-md bg-[#183059] hover:bg-[#0E1F3B] text-white font-bold transition-colors shadow-2xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
