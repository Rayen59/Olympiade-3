export const COURSES_DATA = [
  {
    id: "course-nt",
    theme: "Théorie des Nombres",
    title: "Fondements & Techniques en Théorie des Nombres",
    summary: "Valuations p-adiques, Formule de Legendre, Arithmétique modulaire, Théorèmes d'Euler et de Wilson, Équations diophantiennes.",
    sections: [
      {
        subtitle: "1. Valuation p-adique et Formule de Legendre",
        content: `Pour un nombre premier $p$ et un entier $n \\neq 0$, la **valuation $p$-adique** de $n$, notée $v_p(n)$, est le plus grand exposant $k \\in \\mathbb{N}$ tel que $p^k \\mid n$.

**Propriétés fondamentales :**
- $v_p(ab) = v_p(a) + v_p(b)$
- $v_p(a + b) \\ge \\min(v_p(a), v_p(b))$, avec égalité stricte si $v_p(a) \\neq v_p(b)$
- **Formule de Legendre** pour $n!$ :
  $$v_p(n!) = \\sum_{k=1}^{\\infty} \\left\\lfloor \\frac{n}{p^k} \\right\\rfloor = \\frac{n - S_p(n)}{p - 1}$$
  où $S_p(n)$ est la somme des chiffres de $n$ en base $p$.`
      },
      {
        subtitle: "2. Lemme d'Élévation de la Valuation (LTE)",
        content: `Soit $p$ un nombre premier impair, et $x, y$ des entiers non divisibles par $p$ tels que $p \\mid (x - y)$. Alors pour tout $n \\ge 1$ :
$$v_p(x^n - y^n) = v_p(x - y) + v_p(n)$$

Si $n$ est impair et $p \\mid (x + y)$ :
$$v_p(x^n + y^n) = v_p(x + y) + v_p(n)$$

Pour $p = 2$ et $n$ pair :
$$v_2(x^n - y^n) = v_2(x - y) + v_2(x + y) + v_2(n) - 1$$`
      },
      {
        subtitle: "3. Congruences, Ordres et Théorème d'Euler",
        content: `Si $\\gcd(a, m) = 1$, le plus petit entier positif $d$ tel que $a^d \\equiv 1 \\pmod{m}$ est appelé **l'ordre de $a$ modulo $m$**, noté $\\mathrm{ord}_m(a)$.

- $\\mathrm{ord}_m(a) \\mid \\phi(m)$ (Théorème d'Euler)
- $a^k \\equiv 1 \\pmod{m} \\iff \\mathrm{ord}_m(a) \\mid k$
- **Théorème des restes chinois (CRT) :** Si $m_1, \\dots, m_k$ sont premiers entre eux deux à deux, le système $x \\equiv a_i \\pmod{m_i}$ admet une unique solution modulo $\\prod m_i$.`
      }
    ]
  },
  {
    id: "course-geo",
    theme: "Géométrie",
    title: "Géométrie Pure & Configurations Olympiques",
    summary: "Points cocycliques, Droite de Simson, Droite d'Euler, Puissance d'un point, Axe radical et Théorème de Ptolémée.",
    sections: [
      {
        subtitle: "1. Cocyclicité & Chasse aux Angles",
        content: `Quatre points $A, B, C, D$ sont dits **cocycliques** s'ils appartiennent à un même cercle $\\Gamma$.

**Critères d'équivalence :**
- Angle inscrit : $\\widehat{ACB} = \\widehat{ADB}$ (en angles orientés de droites : $(CA, CB) = (DA, DB) \\pmod{\\pi}$)
- Angles opposés : Dans un quadrilatère convexe $ABCD$, $\\widehat{ABC} + \\widehat{ADC} = 180^\\circ$
- Puissance d'un point : Si les droites $(AB)$ et $(CD)$ se coupent en $P$, alors $PA \\cdot PB = PC \\cdot PD$`
      },
      {
        subtitle: "2. Théorème de Ptolémée",
        content: `Pour tout quadrilatère convexe $ABCD$, on a l'inégalité de Ptolémée :
$$AC \\cdot BD \\le AB \\cdot CD + BC \\cdot DA$$
L'égalité a lieu **si et seulement si** $ABCD$ est inscriptible dans un cercle.

**Formule des diagonales de Ptolémée :**
$$AC^2 = \\frac{(AB \\cdot CD + BC \\cdot DA)(AB \\cdot BC + CD \\cdot DA)}{AB \\cdot DA + BC \\cdot CD}$$`
      },
      {
        subtitle: "3. Axe Radical et Centre Radical",
        content: `Pour un point $P$ et un cercle $\\mathcal{C}(O, R)$, la puissance de $P$ par rapport à $\\mathcal{C}$ est :
$$\\mathcal{P}_{\\mathcal{C}}(P) = PO^2 - R^2$$

L'ensemble des points ayant même puissance par rapport à deux cercles non concentriques est une droite perpendiculaire à la ligne des centres, appelée **axe radical**. Pour trois cercles dont les centres ne sont pas alignés, les trois axes radicaux sont concourants au **centre radical**.`
      }
    ]
  },
  {
    id: "course-comb",
    theme: "Combinatoire",
    title: "Stratégies Olympiques en Combinatoire",
    summary: "Principe des tiroirs, Invariants et monovariants, Dénombrement double, Graphes et Coloriages.",
    sections: [
      {
        subtitle: "1. Principe des Tiroirs (Pigeonhole Principle)",
        content: `Si l'on range $n+1$ objets dans $n$ tiroirs, au moins un tiroir contient au moins $2$ objets.

**Forme générale :**
Si $N$ objets sont placés dans $k$ boîtes, au moins une boîte contient au moins $\\lceil N/k \\rceil$ objets.

**Technique de Dirichlet continue :**
Pour des mesures ou des intervalles, si la somme des longueurs d'intervalles dépasse la longueur totale, il existe une intersection non vide.`
      },
      {
        subtitle: "2. Invariants et Monovariants",
        content: `Face à un processus étape par étape :
- Un **invariant** est une quantité qui reste constante après chaque opération (parité, reste modulo $k$, somme pondérée). S'il diffère entre l'état initial et l'état cible, le passage est impossible.
- Un **monovariant** est une quantité strictement croissante (ou décroissante) qui prend ses valeurs dans un ensemble discret borné. Il garantit la terminaison du processus.`
      },
      {
        subtitle: "3. Double Comptage (Fubini Combinatoire)",
        content: `Soit une matrice binaire $A = (a_{i,j})$ de taille $m \\times n$. En sommant les 1 par lignes puis par colonnes :
$$\\sum_{i=1}^m \\sum_{j=1}^n a_{i,j} = \\sum_{i=1}^m \\text{deg}(L_i) = \\sum_{j=1}^n \\text{deg}(C_j)$$

Cette méthode est fondamentale pour établir des bornes sur les graphes d'incidence et les tournois.`
      }
    ]
  },
  {
    id: "course-ineq",
    theme: "Inégalités",
    title: "Arsenal des Inégalités Olympiques",
    summary: "AM-GM, Cauchy-Schwarz, Forme de Titu, Inégalité de Jensen, Réarrangement et Inégalité de Schur.",
    sections: [
      {
        subtitle: "1. Inégalité AM-GM & Moyennes Généralisées",
        content: `Pour tous réels positifs $a_1, a_2, \\dots, a_n \\ge 0$ :
$$\\frac{a_1 + a_2 + \\dots + a_n}{n} \\ge \\sqrt[n]{a_1 a_2 \\dots a_n}$$
Égalité si et seulement si $a_1 = a_2 = \\dots = a_n$.

**Moyennes $p$-ièmes :**
Pour $p < q$, $M_p(x) \\le M_q(x)$ où $M_p(x) = \\left( \\frac{1}{n} \\sum x_i^p \\right)^{1/p}$. En particulier :
$$QM \\ge AM \\ge GM \\ge HM$$`
      },
      {
        subtitle: "2. Cauchy-Schwarz et Forme de Titu (Engel)",
        content: `Pour tous réels $(a_i)$ et $(b_i)$ :
$$\\left( \\sum_{i=1}^n a_i^2 \\right) \\left( \\sum_{i=1}^n b_i^2 \\right) \\ge \\left( \\sum_{i=1}^n a_i b_i \\right)^2$$

**Forme de Titu (Lemme de Sedrakyan) :**
Pour $x_i \\in \\mathbb{R}$ et $y_i > 0$ :
$$\\frac{x_1^2}{y_1} + \\frac{x_2^2}{y_2} + \\dots + \\frac{x_n^2}{y_n} \\ge \\frac{(x_1 + x_2 + \\dots + x_n)^2}{y_1 + y_2 + \\dots + y_n}$$`
      },
      {
        subtitle: "3. Inégalité de Jensen & Convexité",
        content: `Une fonction $f: I \\to \\mathbb{R}$ est convexe si pour tous $x, y \\in I$ et $t \\in [0, 1]$, $f(tx + (1-t)y) \\le tf(x) + (1-t)f(y)$.

**Théorème de Jensen :**
Pour $f$ convexe, $x_i \\in I$ et poids $\\sum w_i = 1$ ($w_i \\ge 0$) :
$$f\\left( \\sum_{i=1}^n w_i x_i \\right) \\le \\sum_{i=1}^n w_i f(x_i)$$`
      }
    ]
  },
  {
    id: "course-fe",
    theme: "Équations Fonctionnelles",
    title: "Méthodes de Résolution des Équations Fonctionnelles",
    summary: "Substitutions, Injectivité, Surjectivité, Équations de Cauchy, Points fixes et Involutions.",
    sections: [
      {
        subtitle: "1. Techniques de Substitution Fondamentales",
        content: `Pour une équation $P(x, y)$ reliant $f(x)$ et $f(y)$ :
- Substituer $x=0, y=0$, $x=y$, $x=-y$ pour déterminer $f(0)$ et la parité.
- Isoler une variable libre pour prouver la surjectivité (par exemple $f(x + f(y)) = y + g(x)$ prouve que $f$ est surjective et injective).
- Exploiter les points fixes $f(c) = c$.`
      },
      {
        subtitle: "2. Les Quatre Équations de Cauchy",
        content: `Sur $\\mathbb{R}$ sous condition de régularité (continuité, monotonie ou minoration locale) :
1. $f(x+y) = f(x) + f(y) \\iff f(x) = cx$
2. $f(x+y) = f(x)f(y) \\iff f(x) = a^x$ ou $f \\equiv 0$
3. $f(xy) = f(x) + f(y) \\iff f(x) = c \\ln(x)$
4. $f(xy) = f(x)f(y) \\iff f(x) = x^c$ ou $f \\equiv 0$`
      },
      {
        subtitle: "3. Injectivité, Surjectivité et Symétrie",
        content: `**Injectivité :** Si $f(a) = f(b) \\implies a = b$. Permet de simplifier $f(A) = f(B)$ en $A = B$.
**Surjectivité :** Pour tout $z$, il existe $x$ tel que $f(x) = z$. Permet de substituer $z = f(x)$ dans l'équation.
**Symétrie :** Échanger les rôles de $x$ et $y$ si l'un des membres est symétrique en $(x, y)$.`
      }
    ]
  }
];
