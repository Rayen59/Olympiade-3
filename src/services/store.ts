import { User, Problem, Submission, Course, ForumTopic, ForumReply, Olympiad, OlympiadSubmission, OlympiadTheme } from '../types';
import { INITIAL_PROBLEMS } from '../data/problemsData';
import { COURSES_DATA } from '../data/coursesData';

const STORAGE_KEY = 'mk_olympiades_store_v2';
const CURRENT_USER_KEY = 'mk_olympiades_current_user_id';
const EXAM_TIMERS_KEY = 'mk_olympiades_exam_timers';

interface StoreData {
  users: User[];
  problems: Problem[];
  submissions: Submission[];
  courses: Course[];
  forumTopics: ForumTopic[];
  olympiads: Olympiad[];
  olympiadSubmissions: OlympiadSubmission[];
}

const DEFAULT_ADMIN: User = {
  id: 'usr-admin-1',
  username: 'Admin MK',
  email: 'admin12@gmail.com',
  password: 'admin12',
  role: 'admin',
  points: 0,
  solvedProblems: [],
  solvedCount: 0,
  banned: false,
  banUntil: null,
  banReason: null,
  createdAt: new Date().toISOString(),
  avatarColor: '#0056b3',
  bio: 'Administrateur officiel de la plateforme MK Olympiades.'
};

const DEFAULT_OLYMPIAD: Olympiad = {
  id: 'oly-1',
  title: 'Olympiade Mathématique MK - Session Officielle',
  description: 'Épreuve générale d’olympiades de haut niveau. Durée officielle : 4 heures (240 minutes). 4 problèmes notés sur 7 points chacun.',
  durationHours: 4,
  durationMinutes: 0,
  totalDurationMinutes: 240,
  problemCount: 4,
  pointsPerProblem: 7,
  totalPoints: 28,
  goldCutoff: 24,
  silverCutoff: 18,
  bronzeCutoff: 12,
  honorableMentionCutoff: 7,
  pdfUrl: '/assets/olympiade_mk_sujet_officiel.pdf',
  pdfTitle: 'Sujet_Officiel_Olympiade_MK.pdf',
  status: 'active',
  resultsPublished: false,
  createdAt: new Date().toISOString()
};

const DEFAULT_FORUM_TOPICS: ForumTopic[] = [
  {
    id: 'topic-welcome',
    title: 'Bienvenue sur le forum d’olympiades & guide d’écriture LaTeX ($...$)',
    category: 'Général',
    authorId: 'usr-admin-1',
    authorName: 'Admin MK',
    content: `Bienvenue à tous les compétiteurs ! Vous pouvez échanger sur les problèmes, proposer vos conjectures et poser vos questions scientifiques.

Pour insérer des formules mathématiques, utilisez les balises :
- Inline : \`$ x^2 + y^2 = z^2 $\` qui donne $ x^2 + y^2 = z^2 $
- Centré : \`$$ \\sum_{k=1}^n k = \\frac{n(n+1)}{2} $$\`
- N’hésitez pas à prévisualiser votre LaTeX et à joindre des schémas manuscrits ou captures d'écran !`,
    views: 42,
    createdAt: new Date().toISOString(),
    replies: []
  }
];

function getVirginStore(): StoreData {
  return {
    users: [DEFAULT_ADMIN],
    problems: INITIAL_PROBLEMS,
    submissions: [],
    courses: COURSES_DATA,
    forumTopics: DEFAULT_FORUM_TOPICS,
    olympiads: [DEFAULT_OLYMPIAD],
    olympiadSubmissions: []
  };
}

class StoreService {
  private data: StoreData;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.data = this.load();
  }

  private load(): StoreData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure admin user exists
        if (!parsed.users || !parsed.users.some((u: User) => u.email === DEFAULT_ADMIN.email)) {
          parsed.users = [DEFAULT_ADMIN, ...(parsed.users || [])];
        }
        // Preserve user problems if present, else seed with INITIAL_PROBLEMS
        if (!Array.isArray(parsed.problems) || parsed.problems.length === 0) {
          parsed.problems = INITIAL_PROBLEMS;
        }
        parsed.courses = COURSES_DATA;
        if (!parsed.olympiads || parsed.olympiads.length === 0) {
          parsed.olympiads = [DEFAULT_OLYMPIAD];
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to load storage, using virgin store:', e);
    }
    const virgin = getVirginStore();
    this.saveDirect(virgin);
    return virgin;
  }

  private saveDirect(data: StoreData) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Storage save error:', e);
    }
  }

  private save() {
    this.saveDirect(this.data);
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public resetToVirgin() {
    this.data = getVirginStore();
    this.save();
    localStorage.removeItem(EXAM_TIMERS_KEY);
  }

  // ---------------- AUTH ----------------
  public getCurrentUser(): User | null {
    const userId = localStorage.getItem(CURRENT_USER_KEY);
    if (!userId) return null;
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) {
      localStorage.removeItem(CURRENT_USER_KEY);
      return null;
    }
    this.checkBanStatus(user);
    return user;
  }

  public setCurrentUser(user: User | null) {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, user.id);
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
    this.notify();
  }

  public checkBanStatus(user: User): boolean {
    if (!user || !user.banned) return false;
    if (user.banUntil && user.banUntil !== 'permanent') {
      const expiry = new Date(user.banUntil).getTime();
      if (Date.now() >= expiry) {
        user.banned = false;
        user.banUntil = null;
        user.banReason = null;
        this.save();
        return false;
      }
    }
    return true;
  }

  public register(username: string, email: string, password: string): { user?: User; error?: string } {
    const trimmedUser = username.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!trimmedUser || !normalizedEmail || !password) {
      return { error: 'Tous les champs sont obligatoires.' };
    }

    const existing = this.data.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      return { error: 'Cette adresse e-mail est déjà utilisée par un autre compte.' };
    }

    const isAdmin = normalizedEmail === 'admin12@gmail.com' && password === 'admin12';
    const avatarColors = ['#0056b3', '#0f4c81', '#2563eb', '#0284c7', '#0369a1', '#1d4ed8'];
    const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

    const newUser: User = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      username: trimmedUser,
      email: normalizedEmail,
      password,
      role: isAdmin ? 'admin' : 'user',
      points: 0,
      solvedProblems: [],
      solvedCount: 0,
      banned: false,
      banUntil: null,
      banReason: null,
      createdAt: new Date().toISOString(),
      avatarColor: randomColor,
      bio: 'Participant aux Olympiades Mathématiques MK.'
    };

    this.data.users.push(newUser);
    this.save();
    this.setCurrentUser(newUser);
    return { user: newUser };
  }

  public login(email: string, password: string): { user?: User; error?: string } {
    const normalizedEmail = email.trim().toLowerCase();

    // Secret Admin Auto-Login
    if (normalizedEmail === 'admin12@gmail.com' && password === 'admin12') {
      let admin = this.data.users.find((u) => u.email.toLowerCase() === 'admin12@gmail.com');
      if (!admin) {
        admin = { ...DEFAULT_ADMIN };
        this.data.users.unshift(admin);
      } else {
        admin.role = 'admin';
      }
      this.save();
      this.setCurrentUser(admin);
      return { user: admin };
    }

    const user = this.data.users.find((u) => u.email.toLowerCase() === normalizedEmail && u.password === password);
    if (!user) {
      return { error: 'Identifiants incorrects. Vérifiez votre adresse email et mot de passe.' };
    }

    this.checkBanStatus(user);
    this.setCurrentUser(user);
    return { user };
  }

  public logout() {
    this.setCurrentUser(null);
  }

  public deleteAccount(userId: string): { success?: boolean; error?: string } {
    const idx = this.data.users.findIndex((u) => u.id === userId);
    if (idx === -1) return { error: 'Compte introuvable.' };

    if (this.data.users[idx].email.toLowerCase() === 'admin12@gmail.com') {
      return { error: 'Le compte administrateur principal ne peut pas être supprimé.' };
    }

    this.data.users.splice(idx, 1);
    this.data.submissions = this.data.submissions.filter((s) => s.userId !== userId);
    this.data.olympiadSubmissions = this.data.olympiadSubmissions.filter((s) => s.userId !== userId);
    this.save();
    this.logout();
    return { success: true };
  }

  public getUsers(): User[] {
    return [...this.data.users].sort((a, b) => b.points - a.points || b.solvedCount - a.solvedCount);
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  // ---------------- PROBLEMS & SUBMISSIONS ----------------
  public getProblems(theme?: string, points?: number | string): Problem[] {
    let list = this.data.problems;
    if (theme && theme !== 'all') {
      list = list.filter((p) => p.theme === theme);
    }
    if (points && points !== 'all') {
      const pts = typeof points === 'string' ? parseInt(points, 10) : points;
      list = list.filter((p) => p.points === pts);
    }
    return list;
  }

  public getProblemById(id: string): Problem | undefined {
    return this.data.problems.find((p) => p.id === id);
  }

  public createProblem(problemData: {
    problemNumber?: string;
    theme: OlympiadTheme;
    points: number;
    title: string;
    statement: string;
    difficulty?: string;
    images?: string[];
  }): Problem {
    const themePrefixMap: Record<OlympiadTheme, string> = {
      'Théorie des Nombres': 'nt',
      'Géométrie': 'geo',
      'Combinatoire': 'comb',
      'Inégalités': 'ineq',
      'Équations Fonctionnelles': 'fe'
    };
    const prefix = themePrefixMap[problemData.theme] || 'prob';
    const numPart = problemData.problemNumber
      ? problemData.problemNumber.replace(/\D/g, '') || `${Date.now()}`
      : `${Date.now()}`;
    const id = `${prefix}-${numPart}-${Math.random().toString(36).substring(2, 6)}`;

    const newProblem: Problem = {
      id,
      problemNumber: problemData.problemNumber?.trim() || undefined,
      theme: problemData.theme,
      points: Number(problemData.points),
      difficulty: problemData.difficulty || `${problemData.points} pts`,
      title: problemData.title.trim(),
      statement: problemData.statement ? problemData.statement.trim() : '',
      images: Array.isArray(problemData.images) ? problemData.images : [],
      createdAt: new Date().toISOString()
    };

    this.data.problems.unshift(newProblem);
    this.save();
    return newProblem;
  }

  public updateProblem(
    id: string,
    updates: Partial<Omit<Problem, 'id'>> & { problemNumber?: string }
  ): Problem | null {
    const idx = this.data.problems.findIndex((p) => p.id === id);
    if (idx === -1) return null;

    const existing = this.data.problems[idx];
    const points = updates.points !== undefined ? Number(updates.points) : existing.points;
    const updated: Problem = {
      ...existing,
      ...updates,
      points,
      difficulty: updates.difficulty || `${points} pts`,
      title: updates.title !== undefined ? updates.title.trim() : existing.title,
      statement: updates.statement !== undefined ? updates.statement.trim() : existing.statement,
      images: updates.images !== undefined ? updates.images : (existing.images || []),
      problemNumber: updates.problemNumber !== undefined ? (updates.problemNumber.trim() || undefined) : existing.problemNumber,
      updatedAt: new Date().toISOString()
    };

    this.data.problems[idx] = updated;

    // Update problem title and points in existing submissions
    this.data.submissions.forEach((s) => {
      if (s.problemId === id) {
        if (updates.title) s.problemTitle = updates.title.trim();
        if (updates.theme) s.category = updates.theme;
        if (updates.points !== undefined) s.points = points;
      }
    });

    this.save();
    return updated;
  }

  public deleteProblem(id: string): boolean {
    const idx = this.data.problems.findIndex((p) => p.id === id);
    if (idx === -1) return false;

    this.data.problems.splice(idx, 1);
    this.save();
    return true;
  }

  public resetProblemsToInitial(): void {
    this.data.problems = [...INITIAL_PROBLEMS];
    this.save();
  }

  public getMySubmission(problemId: string, userId: string): Submission | null {
    return this.data.submissions.find((s) => s.problemId === problemId && s.userId === userId) || null;
  }

  public getUserSubmissions(userId: string): Submission[] {
    return this.data.submissions.filter((s) => s.userId === userId);
  }

  public submitProblemSolution(
    problemId: string,
    user: User,
    data: { images?: string[]; solutionText?: string }
  ): { success?: boolean; submission?: Submission; error?: string } {
    if (this.checkBanStatus(user)) {
      return { error: `Votre compte est suspendu. Motif : ${user.banReason || 'Activité inappropriée'}.` };
    }

    const problem = this.getProblemById(problemId);
    if (!problem) return { error: 'Problème non trouvé.' };

    const images = Array.isArray(data.images) ? data.images.filter((img) => img && img.trim().length > 0) : [];
    const text = (data.solutionText || '').trim();

    // User requirement: "un user peut envoyer des images seulement ou text latex seulement pas obligatoire les deux au même temps"
    if (images.length === 0 && text.length === 0) {
      return { error: 'Veuillez fournir au moins une image/polycopie OU une rédaction LaTeX de votre solution.' };
    }

    const existingSub = this.data.submissions.find((s) => s.problemId === problem.id && s.userId === user.id);
    if (existingSub) {
      const isAdminReviewed = existingSub.status !== 'pending' || Boolean(existingSub.reviewedAt);
      if (isAdminReviewed && existingSub.status !== 'approved') {
        return {
          error: "L'administrateur a déjà examiné cette copie. La modification n'est permise que si la soumission est validée."
        };
      }

      existingSub.images = images;
      existingSub.imageUrl = images[0] || '';
      existingSub.solutionText = text;
      existingSub.updatedAt = new Date().toISOString();
      this.save();
      return { success: true, submission: existingSub };
    }

    const newSub: Submission = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      problemId: problem.id,
      problemTitle: problem.title,
      category: problem.theme,
      points: problem.points,
      userId: user.id,
      username: user.username,
      userEmail: user.email,
      images,
      imageUrl: images[0] || '',
      solutionText: text,
      status: 'pending',
      reviewReason: null,
      submittedAt: new Date().toISOString(),
      reviewedAt: null
    };

    this.data.submissions.unshift(newSub);
    this.save();
    return { success: true, submission: newSub };
  }

  public deleteSubmission(subId: string, currentUserId: string): { success?: boolean; error?: string } {
    const idx = this.data.submissions.findIndex((s) => s.id === subId);
    if (idx === -1) return { error: 'Soumission introuvable.' };

    const sub = this.data.submissions[idx];
    const currentUser = this.getUserById(currentUserId);
    const isOwner = sub.userId === currentUserId;
    const isAdmin = currentUser?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return { error: 'Action non autorisée.' };
    }

    if (sub.status === 'approved') {
      const author = this.getUserById(sub.userId);
      if (author) {
        author.points = Math.max(0, author.points - sub.points);
        author.solvedProblems = author.solvedProblems.filter((id) => id !== sub.problemId);
        author.solvedCount = author.solvedProblems.length;
      }
    }

    this.data.submissions.splice(idx, 1);
    this.save();
    return { success: true };
  }

  // ---------------- OLYMPIADS & COUNTDOWN TIMER ----------------
  public getOlympiads(): Olympiad[] {
    return this.data.olympiads || [];
  }

  public getOlympiadById(id: string): Olympiad | undefined {
    return this.data.olympiads.find((o) => o.id === id);
  }

  public createOlympiad(newOly: Omit<Olympiad, 'id' | 'createdAt'>): Olympiad {
    const oly: Olympiad = {
      ...newOly,
      id: `oly-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.data.olympiads.unshift(oly);
    this.save();
    return oly;
  }

  public updateOlympiadMedalCutoffs(
    olyId: string,
    cutoffs: { gold: number; silver: number; bronze: number; mention: number }
  ): boolean {
    const oly = this.getOlympiadById(olyId);
    if (!oly) return false;
    oly.goldCutoff = cutoffs.gold;
    oly.silverCutoff = cutoffs.silver;
    oly.bronzeCutoff = cutoffs.bronze;
    oly.honorableMentionCutoff = cutoffs.mention;

    // Instantly update medals for all graded submissions
    this.data.olympiadSubmissions
      .filter((s) => s.olympiadId === olyId && s.status === 'graded')
      .forEach((sub) => {
        const total = sub.overallScore;
        let medal = 'Certificat de Participation';
        if (total >= oly.goldCutoff) {
          medal = "🥇 Médaille d'Or";
        } else if (total >= oly.silverCutoff) {
          medal = "🥈 Médaille d'Argent";
        } else if (total >= oly.bronzeCutoff) {
          medal = "🥉 Médaille de Bronze";
        } else if (total >= (oly.honorableMentionCutoff || oly.pointsPerProblem)) {
          medal = '🎖️ Mention Honorable';
        }
        sub.medal = medal;
      });

    this.save();
    return true;
  }

  public toggleOlympiadResults(olyId: string, published: boolean): boolean {
    const oly = this.getOlympiadById(olyId);
    if (!oly) return false;
    oly.resultsPublished = published;
    this.save();
    return true;
  }

  public updateOlympiad(olyId: string, updates: Partial<Olympiad>): Olympiad | null {
    const oly = this.getOlympiadById(olyId);
    if (!oly) return null;

    if (updates.totalDurationMinutes !== undefined) {
      const totalMins = Math.max(1, Number(updates.totalDurationMinutes));
      oly.totalDurationMinutes = totalMins;
      oly.durationHours = Math.floor(totalMins / 60);
      oly.durationMinutes = totalMins % 60;
    } else if (updates.durationHours !== undefined || updates.durationMinutes !== undefined) {
      const h = updates.durationHours !== undefined ? Math.max(0, Number(updates.durationHours)) : oly.durationHours;
      const m = updates.durationMinutes !== undefined ? Math.max(0, Number(updates.durationMinutes)) : oly.durationMinutes;
      oly.durationHours = h;
      oly.durationMinutes = m;
      oly.totalDurationMinutes = Math.max(1, h * 60 + m);
    }

    if (updates.title !== undefined) oly.title = updates.title.trim();
    if (updates.description !== undefined) oly.description = updates.description.trim();
    if (updates.pdfUrl !== undefined) oly.pdfUrl = updates.pdfUrl;
    if (updates.pdfTitle !== undefined) oly.pdfTitle = updates.pdfTitle;
    if (updates.pdfFileSize !== undefined) oly.pdfFileSize = updates.pdfFileSize;
    if (updates.pdfUpdatedAt !== undefined) oly.pdfUpdatedAt = updates.pdfUpdatedAt;
    if (updates.problemCount !== undefined) oly.problemCount = Number(updates.problemCount);
    if (updates.pointsPerProblem !== undefined) oly.pointsPerProblem = Number(updates.pointsPerProblem);
    if (updates.totalPoints !== undefined) oly.totalPoints = Number(updates.totalPoints);
    if (updates.goldCutoff !== undefined) oly.goldCutoff = Number(updates.goldCutoff);
    if (updates.silverCutoff !== undefined) oly.silverCutoff = Number(updates.silverCutoff);
    if (updates.bronzeCutoff !== undefined) oly.bronzeCutoff = Number(updates.bronzeCutoff);
    if (updates.honorableMentionCutoff !== undefined) oly.honorableMentionCutoff = Number(updates.honorableMentionCutoff);
    if (updates.status !== undefined) oly.status = updates.status;
    if (updates.resultsPublished !== undefined) oly.resultsPublished = updates.resultsPublished;

    this.save();
    return oly;
  }

  public resetExamTimer(olyId: string, userId?: string) {
    try {
      const stored = localStorage.getItem(EXAM_TIMERS_KEY);
      if (stored) {
        const timers = JSON.parse(stored);
        if (userId) {
          delete timers[`${olyId}_${userId}`];
        } else {
          Object.keys(timers).forEach((k) => {
            if (k.startsWith(`${olyId}_`)) delete timers[k];
          });
        }
        localStorage.setItem(EXAM_TIMERS_KEY, JSON.stringify(timers));
      }
    } catch {
      // ignore
    }
    this.notify();
  }

  public deleteOlympiad(olyId: string) {
    this.data.olympiads = this.data.olympiads.filter((o) => o.id !== olyId);
    this.data.olympiadSubmissions = this.data.olympiadSubmissions.filter((s) => s.olympiadId !== olyId);
    this.save();
  }

  // Examination Countdown State:
  public getExamStartTime(olyId: string, userId: string): number | null {
    try {
      const stored = localStorage.getItem(EXAM_TIMERS_KEY);
      if (stored) {
        const timers = JSON.parse(stored);
        return timers[`${olyId}_${userId}`] || null;
      }
    } catch {
      // ignore
    }
    return null;
  }

  public startExam(olyId: string, userId: string): number {
    let timers: Record<string, number> = {};
    try {
      const stored = localStorage.getItem(EXAM_TIMERS_KEY);
      if (stored) timers = JSON.parse(stored);
    } catch {
      // ignore
    }
    const key = `${olyId}_${userId}`;
    if (!timers[key]) {
      timers[key] = Date.now();
      localStorage.setItem(EXAM_TIMERS_KEY, JSON.stringify(timers));
    }
    this.notify();
    return timers[key];
  }

  public submitOlympiadCopies(
    olyId: string,
    user: User,
    data: { images?: string[]; solutionNotes?: string }
  ): { success?: boolean; submission?: OlympiadSubmission; error?: string } {
    if (this.checkBanStatus(user)) {
      return { error: 'Votre compte est suspendu. Participation refusée.' };
    }

    const oly = this.getOlympiadById(olyId);
    if (!oly) return { error: 'Olympiade non trouvée.' };

    // Check Countdown Timer Constraint:
    // User request: "ajouter a lui si il débute un chronomètre qui descent et lorsque il termine il ne leur envoyer aucun choses"
    const startTime = this.getExamStartTime(olyId, user.id);
    if (startTime) {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const totalAllowedSeconds = oly.totalDurationMinutes * 60;
      if (elapsedSeconds >= totalAllowedSeconds) {
        return {
          error: "Temps officiel écoulé ! Le chronomètre est arrivé à terme. Aucune soumission ne peut plus être acceptée."
        };
      }
    }

    const images = Array.isArray(data.images) ? data.images.filter((img) => img && img.trim().length > 0) : [];
    const notes = (data.solutionNotes || '').trim();

    // User requirement: "un user peut envoyer des images seulement ou text latex seulement pas obligatoire les deux au même temps"
    if (images.length === 0 && notes.length === 0) {
      return {
        error: 'Veuillez joindre au moins une image de copie manuscrite OU votre rédaction de solution en LaTeX.'
      };
    }

    let sub = this.data.olympiadSubmissions.find((s) => s.olympiadId === oly.id && s.userId === user.id);
    if (sub) {
      sub.images = images;
      sub.solutionNotes = notes;
      sub.updatedAt = new Date().toISOString();
      sub.status = 'submitted';
    } else {
      sub = {
        id: `olysub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        olympiadId: oly.id,
        userId: user.id,
        username: user.username,
        userEmail: user.email,
        images,
        solutionNotes: notes,
        status: 'submitted',
        problemScores: {},
        overallScore: 0,
        medal: 'Non évalué',
        feedback: '',
        submittedAt: new Date().toISOString(),
        gradedAt: null
      };
      this.data.olympiadSubmissions.unshift(sub);
    }

    this.save();
    return { success: true, submission: sub };
  }

  public getMyOlympiadSubmission(olyId: string, userId: string): OlympiadSubmission | null {
    return this.data.olympiadSubmissions.find((s) => s.olympiadId === olyId && s.userId === userId) || null;
  }

  public getUserOlympiadSubmissions(userId: string): OlympiadSubmission[] {
    return this.data.olympiadSubmissions.filter((s) => s.userId === userId);
  }

  public getOlympiadSubmissionsForAdmin(olyId: string): OlympiadSubmission[] {
    return this.data.olympiadSubmissions.filter((s) => s.olympiadId === olyId);
  }

  public gradeOlympiadSubmission(
    olyId: string,
    subId: string,
    scores: Record<string, number>,
    feedback: string
  ): { success?: boolean; submission?: OlympiadSubmission; error?: string } {
    const oly = this.getOlympiadById(olyId);
    if (!oly) return { error: 'Olympiade introuvable.' };

    const sub = this.data.olympiadSubmissions.find((s) => s.id === subId && s.olympiadId === olyId);
    if (!sub) return { error: 'Soumission introuvable.' };

    let total = 0;
    const parsedScores: Record<string, number> = {};
    for (let i = 1; i <= oly.problemCount; i++) {
      const key = `P${i}`;
      const val = Math.max(0, Math.min(scores[key] ?? scores[i.toString()] ?? 0, oly.pointsPerProblem));
      parsedScores[key] = val;
      total += val;
    }

    let medal = 'Certificat de Participation';
    if (total >= oly.goldCutoff) {
      medal = "🥇 Médaille d'Or";
    } else if (total >= oly.silverCutoff) {
      medal = "🥈 Médaille d'Argent";
    } else if (total >= oly.bronzeCutoff) {
      medal = "🥉 Médaille de Bronze";
    } else if (total >= (oly.honorableMentionCutoff || oly.pointsPerProblem)) {
      medal = '🎖️ Mention Honorable';
    }

    sub.problemScores = parsedScores;
    sub.overallScore = total;
    sub.medal = medal;
    sub.feedback = feedback || 'Copie examinée et notée par le jury MK.';
    sub.status = 'graded';
    sub.gradedAt = new Date().toISOString();

    const candidate = this.getUserById(sub.userId);
    if (candidate) {
      candidate.points = Math.max(candidate.points, candidate.points + total);
    }

    this.save();
    return { success: true, submission: sub };
  }

  public getOlympiadLeaderboard(olyId: string): { locked: boolean; rankings: OlympiadSubmission[] } {
    const oly = this.getOlympiadById(olyId);
    if (!oly) return { locked: true, rankings: [] };

    const subs = this.data.olympiadSubmissions
      .filter((s) => s.olympiadId === olyId && s.status === 'graded')
      .sort((a, b) => b.overallScore - a.overallScore);

    return {
      locked: !oly.resultsPublished,
      rankings: subs
    };
  }

  // ---------------- ADMIN PROBLEM REVIEWS & USER BANS ----------------
  public getAllSubmissions(): Submission[] {
    return [...this.data.submissions];
  }

  public reviewSubmission(
    subId: string,
    status: 'approved' | 'rejected',
    reason?: string
  ): { success?: boolean; error?: string } {
    const sub = this.data.submissions.find((s) => s.id === subId);
    if (!sub) return { error: 'Soumission introuvable.' };

    const prevStatus = sub.status;
    sub.status = status;
    sub.reviewReason = reason || (status === 'approved' ? 'Validé par l’administrateur.' : 'Démonstration incomplète.');
    sub.reviewedAt = new Date().toISOString();

    const author = this.getUserById(sub.userId);
    if (author) {
      if (status === 'approved' && prevStatus !== 'approved') {
        author.points += sub.points;
        if (!author.solvedProblems.includes(sub.problemId)) {
          author.solvedProblems.push(sub.problemId);
          author.solvedCount = author.solvedProblems.length;
        }
      } else if (status === 'rejected' && prevStatus === 'approved') {
        author.points = Math.max(0, author.points - sub.points);
        author.solvedProblems = author.solvedProblems.filter((id) => id !== sub.problemId);
        author.solvedCount = author.solvedProblems.length;
      }
    }

    this.save();
    return { success: true };
  }

  public banUser(userId: string, duration: string, reason?: string): { success?: boolean; error?: string } {
    const user = this.getUserById(userId);
    if (!user) return { error: 'Utilisateur introuvable.' };
    if (user.role === 'admin') return { error: 'Impossible de bannir un administrateur.' };

    let banUntil: string | null = null;
    const now = Date.now();
    switch (duration) {
      case '1_day':
        banUntil = new Date(now + 24 * 3600 * 1000).toISOString();
        break;
      case '3_days':
        banUntil = new Date(now + 3 * 24 * 3600 * 1000).toISOString();
        break;
      case '7_days':
        banUntil = new Date(now + 7 * 24 * 3600 * 1000).toISOString();
        break;
      case '1_month':
        banUntil = new Date(now + 30 * 24 * 3600 * 1000).toISOString();
        break;
      case 'permanent':
        banUntil = 'permanent';
        break;
      default:
        return { error: 'Durée invalide.' };
    }

    user.banned = true;
    user.banUntil = banUntil;
    user.banReason = reason || 'Non-respect des règles académiques ou plagiat.';
    this.save();
    return { success: true };
  }

  public unbanUser(userId: string): { success?: boolean; error?: string } {
    const user = this.getUserById(userId);
    if (!user) return { error: 'Utilisateur introuvable.' };
    user.banned = false;
    user.banUntil = null;
    user.banReason = null;
    this.save();
    return { success: true };
  }

  // ---------------- FORUM & REPLIES ----------------
  public getForumTopics(category?: string): ForumTopic[] {
    let list = this.data.forumTopics || [];
    if (category && category !== 'all') {
      list = list.filter((t) => t.category === category);
    }
    return list;
  }

  public getForumTopicById(id: string): ForumTopic | undefined {
    const topic = (this.data.forumTopics || []).find((t) => t.id === id);
    if (topic) {
      topic.views = (topic.views || 0) + 1;
      this.save();
    }
    return topic;
  }

  public createForumTopic(
    user: User,
    data: {
      title: string;
      category: string;
      content?: string;
      imageUrl?: string | null;
      images?: string[];
    }
  ): { success?: boolean; topic?: ForumTopic; error?: string } {
    if (this.checkBanStatus(user)) {
      return { error: `Votre compte est suspendu. Motif : ${user.banReason || 'non autorisé'}.` };
    }

    const { title, category, content = '', imageUrl, images } = data;
    if (!title?.trim() || !category) {
      return { error: 'Le titre et la catégorie sont obligatoires.' };
    }

    const hasText = Boolean(content && content.trim().length > 0);
    const resolvedImages = (images && images.length > 0)
      ? images
      : (imageUrl ? [imageUrl] : []);
    const hasImage = resolvedImages.length > 0;

    if (!hasText && !hasImage) {
      return { error: 'Veuillez saisir du texte LaTeX ou joindre au moins une photo/image.' };
    }

    // Safety filter
    if (hasText) {
      const check = this.checkContentSafety(title, content);
      if (!check.approved) {
        return { error: check.reason };
      }
    } else {
      const check = this.checkContentSafety(title, '');
      if (!check.approved) {
        return { error: check.reason };
      }
    }

    const topic: ForumTopic = {
      id: `topic-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      category,
      authorId: user.id,
      authorName: user.username,
      content: content.trim(),
      imageUrl: resolvedImages[0] || null,
      images: resolvedImages,
      views: 1,
      createdAt: new Date().toISOString(),
      replies: []
    };

    if (!this.data.forumTopics) this.data.forumTopics = [];
    this.data.forumTopics.unshift(topic);
    this.save();
    return { success: true, topic };
  }

  public replyToForumTopic(
    topicId: string,
    user: User,
    data: { content?: string; imageUrl?: string | null; images?: string[] }
  ): { success?: boolean; reply?: ForumReply; error?: string } {
    if (this.checkBanStatus(user)) {
      return { error: `Votre compte est suspendu. Motif : ${user.banReason || 'non autorisé'}.` };
    }

    const topic = (this.data.forumTopics || []).find((t) => t.id === topicId);
    if (!topic) return { error: 'Sujet introuvable.' };

    const { content = '', imageUrl, images } = data;
    const resolvedImages = (images && images.length > 0)
      ? images
      : (imageUrl ? [imageUrl] : []);
    const hasText = Boolean(content && content.trim().length > 0);
    const hasImage = resolvedImages.length > 0;

    if (!hasText && !hasImage) {
      return { error: 'Votre réponse doit contenir du texte LaTeX ou au moins une image.' };
    }

    if (hasText) {
      const check = this.checkContentSafety('', content);
      if (!check.approved) {
        return { error: check.reason };
      }
    }

    const reply: ForumReply = {
      id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      authorId: user.id,
      authorName: user.username,
      content: content.trim(),
      imageUrl: resolvedImages[0] || null,
      images: resolvedImages,
      createdAt: new Date().toISOString()
    };

    if (!topic.replies) topic.replies = [];
    topic.replies.push(reply);
    this.save();
    return { success: true, reply };
  }

  public deleteForumTopic(topicId: string, currentUser?: User | null): { success?: boolean; error?: string } {
    if (!currentUser) return { error: 'Authentification requise.' };
    const topic = (this.data.forumTopics || []).find((t) => t.id === topicId);
    if (!topic) return { error: 'Sujet introuvable.' };

    if (currentUser.role !== 'admin' && currentUser.id !== topic.authorId) {
      return { error: 'Seul un administrateur ou l’auteur peut supprimer ce sujet de discussion.' };
    }

    this.data.forumTopics = (this.data.forumTopics || []).filter((t) => t.id !== topicId);
    this.save();
    return { success: true };
  }

  public deleteForumReply(topicId: string, replyId: string, currentUser?: User | null): { success?: boolean; error?: string } {
    if (!currentUser) return { error: 'Authentification requise.' };
    const topic = (this.data.forumTopics || []).find((t) => t.id === topicId);
    if (!topic) return { error: 'Sujet introuvable.' };

    const reply = (topic.replies || []).find((r) => r.id === replyId);
    if (!reply) return { error: 'Réponse introuvable.' };

    if (currentUser.role !== 'admin' && currentUser.id !== reply.authorId) {
      return { error: 'Seul un administrateur ou l’auteur peut supprimer cette réponse.' };
    }

    topic.replies = (topic.replies || []).filter((r) => r.id !== replyId);
    this.save();
    return { success: true };
  }

  private checkContentSafety(title: string, content: string): { approved: boolean; reason: string } {
    const FORBIDDEN_WORDS = [
      'spam', 'casino', 'viagra', 'crypto scam', 'plagiat', 'insulte',
      'connard', 'salaud', 'merde', 'putain', 'idiot', 'imbecile', 'hack',
      'cheat', 'leak', 'nude', 'porn', 'xxx'
    ];
    const text = `${title} ${content}`.toLowerCase();
    for (const w of FORBIDDEN_WORDS) {
      if (text.includes(w)) {
        return {
          approved: false,
          reason: `Contenu rejeté : terme non autorisé "${w}". Respectez les règles académiques de la plateforme MK Olympiades.`
        };
      }
    }
    return { approved: true, reason: 'OK' };
  }

  // ---------------- COURSES ----------------
  public getCourses(): Course[] {
    return this.data.courses || COURSES_DATA;
  }
}

export const store = new StoreService();
