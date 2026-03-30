

## Add Framework Manager to Sidebar

### What already exists
- `src/pages/AdminFrameworkManager.tsx` — full three-panel Framework Manager with CRUD dialogs, admin guard, all Supabase queries
- Route `/admin/frameworks` already configured in `App.tsx` (line 90)
- Page has admin-only access via `useIsAdmin()` + `<Navigate to="/dashboard" />`

### What's missing
The sidebar has no link to `/admin/frameworks`. Only one file needs changing.

### Changes

**File: `src/components/AppSidebar.tsx`**

1. Add `BookOpen` to the lucide-react import (line 22-24)
2. Add Framework Manager as the first item in the `adminNav` array (line 58):
   ```typescript
   const adminNav: NavItem[] = [
     { title: "Framework Manager", subtitle: "Manage assessment frameworks", url: "/admin/frameworks", icon: BookOpen },
     { title: "User Management", subtitle: "Manage team roles & access", url: "/settings/users", icon: Users },
     { title: "AI Configuration", subtitle: "Manage AI prompts & models", url: "/admin/ai-config", icon: Bot },
     { title: "Settings", subtitle: "Account & app configuration", url: "/settings", icon: Settings2 },
   ];
   ```

No other files need changes.

