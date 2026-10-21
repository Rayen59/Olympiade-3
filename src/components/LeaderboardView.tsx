import React from 'react';
import { store } from '../services/store';
import { Trophy, Medal } from 'lucide-react';

export const LeaderboardView: React.FC = () => {
  const users = store.getUsers();

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
        <h1 className="text-lg sm:text-xl font-bold text-[#0a3d75] flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          Classement Général des Candidats
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Projet vierge sans profils virtuels : classement officiel en direct basé sur les points attribués lors des validations réelles de copies.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3 w-16 text-center">Rang</th>
                <th className="p-3">Participant</th>
                <th className="p-3">Rôle</th>
                <th className="p-3 text-center">Problèmes Résolus</th>
                <th className="p-3 text-right">Points Totaux</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user, idx) => (
                <tr key={user.id} className="hover:bg-slate-50/70 transition">
                  <td className="p-3 text-center font-bold">
                    {idx === 0 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs">
                        🥇 1
                      </span>
                    ) : idx === 1 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-800 text-xs">
                        🥈 2
                      </span>
                    ) : idx === 2 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/20 text-amber-900 text-xs">
                        🥉 3
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono">#{idx + 1}</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        style={{ backgroundColor: user.avatarColor || '#0056b3' }}
                        className="w-7 h-7 rounded-full text-white font-bold flex items-center justify-center text-xs shadow-2xs"
                      >
                        {user.username.substring(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">{user.username}</span>
                        <span className="text-[10px] text-slate-400">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        user.role === 'admin'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {user.role === 'admin' ? 'Administrateur' : 'Candidat'}
                    </span>
                  </td>
                  <td className="p-3 text-center font-bold text-slate-700">
                    {user.solvedCount || (user.solvedProblems ? user.solvedProblems.length : 0)} problème(s)
                  </td>
                  <td className="p-3 text-right">
                    <span className="font-black text-sm text-[#0056b3] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                      {user.points} pts
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
