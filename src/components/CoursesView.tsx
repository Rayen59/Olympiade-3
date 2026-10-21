import React, { useState } from 'react';
import { store } from '../services/store';
import { MathView } from './MathView';
import { BookOpen, ChevronRight, Bookmark } from 'lucide-react';

export const CoursesView: React.FC = () => {
  const courses = store.getCourses();
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || 'course-nt');

  const activeCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
        <h1 className="text-lg sm:text-xl font-bold text-[#0a3d75] flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          Cours Théoriques Isolés
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Corpus théorique indépendant pour les olympiades internationales : définitions rigoureuses, théorèmes cardinaux et méthodes de démonstration rédigées.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Sidebar */}
        <aside className="md:col-span-1 bg-white border border-slate-200 rounded-xl p-3 shadow-xs h-fit space-y-1">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
            Sommaire des Modules
          </span>
          {courses.map((course) => (
            <button
              key={course.id}
              onClick={() => setSelectedCourseId(course.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-between ${
                activeCourse?.id === course.id
                  ? 'bg-[#0056b3] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="truncate pr-1">
                <span className="block text-[10px] opacity-75 font-normal">{course.theme}</span>
                <span className="truncate">{course.title.split('&')[0]}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-80" />
            </button>
          ))}
        </aside>

        {/* Content Pane */}
        {activeCourse && (
          <main className="md:col-span-3 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[11px] font-bold text-[#0056b3] bg-blue-50 px-2 py-0.5 rounded border border-blue-100 inline-block mb-1">
                {activeCourse.theme}
              </span>
              <h2 className="text-base sm:text-xl font-black text-slate-900">{activeCourse.title}</h2>
              <p className="text-xs text-slate-500 mt-1 italic leading-relaxed">{activeCourse.summary}</p>
            </div>

            <div className="space-y-6">
              {activeCourse.sections.map((section, idx) => (
                <article key={idx} className="p-4.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2.5">
                  <h3 className="text-sm font-bold text-[#0a3d75] flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-blue-600" />
                    {section.subtitle}
                  </h3>
                  <div className="text-xs leading-relaxed text-slate-800 bg-white p-3.5 rounded-lg border border-slate-200/80">
                    <MathView content={section.content} />
                  </div>
                </article>
              ))}
            </div>
          </main>
        )}
      </div>
    </div>
  );
};
