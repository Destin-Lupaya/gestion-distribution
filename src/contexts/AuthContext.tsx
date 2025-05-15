import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Définition des types de rôles utilisateurs
export type UserRole = 
  | 'admin'           // Administrateur Système
  | 'manager'         // Coordinateur de Programme / Chef de Projet
  | 'field'           // Agent d'Enregistrement / Agent de Terrain
  | 'distribution'    // Agent de Distribution
  | 'logistics'       // Gestionnaire de Stock / Logisticien
  | 'monitoring'      // Agent de Suivi et Évaluation
  | 'partner'         // Point Focal Partenaire
  | 'clerk';          // Opérateur de Saisie

// Interface pour l'utilisateur
export interface User {
  username: string;
  role: UserRole;
  name: string;
  permissions?: string[];
}

// Interface pour le contexte d'authentification
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

// Création du contexte d'authentification
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Définition des permissions par rôle
const rolePermissions: Record<UserRole, string[]> = {
  admin: [
    'user:create', 'user:read', 'user:update', 'user:delete',
    'role:assign', 'role:read',
    'system:configure', 'system:backup',
    'audit:read',
    'program:create', 'program:read', 'program:update', 'program:delete',
    'distribution:read', 'distribution:approve', 'distribution:cancel',
    'beneficiary:read',
    'stock:read',
    'report:generate'
  ],
  manager: [
    'program:create', 'program:read', 'program:update',
    'distribution:plan', 'distribution:read', 'distribution:approve', 'distribution:cancel',
    'beneficiary:read', 'beneficiary:validate',
    'stock:read',
    'report:generate'
  ],
  field: [
    'beneficiary:create', 'beneficiary:read', 'beneficiary:update',
    'household:create', 'household:read', 'household:update',
    'signature:collect',
    'distribution:read'
  ],
  distribution: [
    'distribution:read', 'distribution:execute',
    'beneficiary:read',
    'signature:collect',
    'exception:handle',
    'report:distribution'
  ],
  logistics: [
    'stock:create', 'stock:read', 'stock:update',
    'inventory:create', 'inventory:read', 'inventory:update',
    'dispatch:create', 'dispatch:read',
    'report:stock'
  ],
  monitoring: [
    'distribution:read',
    'beneficiary:read',
    'survey:create', 'survey:read', 'survey:update',
    'report:generate', 'report:read'
  ],
  partner: [
    'program:read',
    'distribution:read',
    'beneficiary:read',
    'report:read'
  ],
  clerk: [
    'data:entry',
    'beneficiary:read',
    'distribution:read'
  ]
};

// Provider du contexte d'authentification
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Nous n'utilisons plus useNavigate ici car il doit être utilisé dans un composant enfant de Router

  // Vérifier si l'utilisateur est déjà connecté au chargement de l'application
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        // Ajouter les permissions basées sur le rôle
        parsedUser.permissions = rolePermissions[parsedUser.role];
        setUser(parsedUser);
      } catch (err) {
        console.error('Erreur lors de la récupération des données utilisateur:', err);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Fonction de connexion
  const login = async (username: string, password: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // Simuler une requête d'authentification
      // Dans une vraie application, vous appelleriez votre API ici
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Vérification simple pour la démo
      if (username === 'admin' && password === 'admin') {
        const userData: User = {
          username,
          role: 'admin',
          name: 'Administrateur Système',
          permissions: rolePermissions['admin']
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return;
      } else if (username === 'manager' && password === 'manager') {
        const userData: User = {
          username,
          role: 'manager',
          name: 'Coordinateur de Programme',
          permissions: rolePermissions['manager']
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return;
      } else if (username === 'field' && password === 'field') {
        const userData: User = {
          username,
          role: 'field',
          name: 'Agent de Terrain',
          permissions: rolePermissions['field']
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return;
      } else if (username === 'distribution' && password === 'distribution') {
        const userData: User = {
          username,
          role: 'distribution',
          name: 'Agent de Distribution',
          permissions: rolePermissions['distribution']
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return;
      } else if (username === 'logistics' && password === 'logistics') {
        const userData: User = {
          username,
          role: 'logistics',
          name: 'Gestionnaire de Stock',
          permissions: rolePermissions['logistics']
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return;
      } else if (username === 'monitoring' && password === 'monitoring') {
        const userData: User = {
          username,
          role: 'monitoring',
          name: 'Agent de Suivi et Évaluation',
          permissions: rolePermissions['monitoring']
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return;
      } else if (username === 'partner' && password === 'partner') {
        const userData: User = {
          username,
          role: 'partner',
          name: 'Point Focal Partenaire',
          permissions: rolePermissions['partner']
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return;
      } else if (username === 'clerk' && password === 'clerk') {
        const userData: User = {
          username,
          role: 'clerk',
          name: 'Opérateur de Saisie',
          permissions: rolePermissions['clerk']
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return;
      } else {
        setError('Nom d\'utilisateur ou mot de passe incorrect');
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la connexion');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fonction de déconnexion
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    // La redirection sera gérée par le composant qui appelle cette fonction
  };

  // Vérifier si l'utilisateur a une permission spécifique
  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  };

  // Vérifier si l'utilisateur a un rôle spécifique ou l'un des rôles spécifiés
  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, hasPermission, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};
