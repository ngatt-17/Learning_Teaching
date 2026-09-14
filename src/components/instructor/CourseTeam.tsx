import React from 'react';
import { useApp } from '../../context/AppContext';
import { Users, Shield, ShieldCheck, Check, X, Info } from 'lucide-react';

export const CourseTeam: React.FC = () => {
  const { activeCourse, allUsers, currentUser } = useApp();

  const isProf = currentUser.role === 'professor';

  const teamMembers = allUsers.filter(
    (u) => u.role === 'professor' || u.role === 'ta'
  );

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-[#D0D7DE] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs">
            <span className="px-2 py-0.5 rounded-md font-bold bg-blue-50 text-[#183059] border border-blue-200">
              {activeCourse.code} Instructional Governance
            </span>
            <span className="text-[#656D76] font-medium">Role & Delegation Model</span>
          </div>
          <h1 className="text-xl font-bold text-[#1F2328] tracking-tight">
            Course Teaching Team & Delegated Permissions
          </h1>
          <p className="text-xs text-[#656D76] mt-1 max-w-2xl">
            PRD Section 4 specifies a delegated permission model: TAs can draft materials and questions, while formal publication and certified AI source approvals remain with Course Faculty.
          </p>
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white rounded-xl border border-[#D0D7DE] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#D0D7DE] flex items-center justify-between bg-[#F6F8FA]">
          <h3 className="text-sm font-bold text-[#1F2328]">Teaching Staff Access Matrix</h3>
          <span className="text-xs text-[#656D76]">VinUni Academic Role Hierarchy</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#D0D7DE] text-[#656D76] font-semibold bg-[#F6F8FA]">
                <th className="py-3 px-4">Instructor / TA</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 text-center">Upload Drafts</th>
                <th className="py-3 px-4 text-center">Generate Qs</th>
                <th className="py-3 px-4 text-center">Publish Question Banks</th>
                <th className="py-3 px-4 text-center">Approve Official AI Sources</th>
                <th className="py-3 px-4 text-center">Manage Canvas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D0D7DE]">
              {teamMembers.map((member) => {
                const isMemberProf = member.role === 'professor';
                const perms = member.delegatedPermissions;

                return (
                  <tr key={member.id} className="hover:bg-[#F6F8FA] transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-[#D0D7DE]"
                        />
                        <div>
                          <div className="font-bold text-[#1F2328]">{member.name}</div>
                          <div className="text-[11px] text-[#656D76]">{member.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          isMemberProf
                            ? 'bg-blue-50 text-[#183059] border border-blue-200'
                            : 'bg-red-50 text-[#C8102E] border border-red-200'
                        }`}
                      >
                        {member.role}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 text-[#183059] border border-blue-200">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 text-[#183059] border border-blue-200">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      {isMemberProf ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 text-[#183059] border border-blue-200">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : perms?.canPublishQuestionBanks ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 text-[#183059] border border-blue-200">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-50 text-[#C8102E] border border-red-200"
                          title="Requires Professor Approval"
                        >
                          <X className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-center">
                      {isMemberProf ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 text-[#183059] border border-blue-200">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-50 text-[#C8102E] border border-red-200"
                          title="Faculty Authority Only"
                        >
                          <X className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-center">
                      {isMemberProf ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 text-[#183059] border border-blue-200">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-50 text-[#C8102E] border border-red-200">
                          <X className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
