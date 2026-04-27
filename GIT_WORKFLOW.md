# LifeOS Git & Worktree Workflow

This document outlines how to use Git (and optionally `git worktree`) to manage the development of each module in the LifeOS project independently. By keeping modules in separate branches, you can review, test, and merge code iteratively without disrupting the main branch.

## 1. Branch Naming Convention

For every module described in `MODULE_PROMPTS.md`, create a new branch from `dev`. Use the following naming convention:
- `module-0-setup`
- `module-1-tasks`
- `module-2-recharge`
- `module-3-settings`
...and so on.

## 2. Standard Branching Workflow

When starting a new module, follow these steps:

```bash
# 1. Ensure you are on the dev branch and it's up to date
git checkout dev
git pull origin dev

# 2. Create and switch to the module branch
git checkout -b module-0-setup

# ... execute module prompt & let the AI write code ...

# 3. Review, stage, and commit the changes
git add .
git commit -m "feat: complete module 0 setup"

# 4. Push the branch to remote
git push -u origin module-0-setup

# 5. Once tested, merge into dev
git checkout dev
git merge module-0-setup
git push origin dev
```

## 3. Advanced: Using Git Worktrees

If you prefer to have multiple modules checked out at the same time in separate physical folders (without constantly switching branches in your main directory), you can use `git worktree`.

### Setup a Worktree

```bash
# 1. Create a worktree for a specific module
# This creates a new folder `../LifeOS-module-0` alongside your main `LifeOS` folder, checked out to the new branch
git worktree add ../LifeOS-module-0 -b module-0-setup dev

# 2. Open that new folder in your code editor
code ../LifeOS-module-0
```

### Clean Up Worktree

Once you've finished the module and merged it back into `dev`, you can safely remove the worktree:

```bash
# 1. Remove the folder and unregister the worktree
git worktree remove ../LifeOS-module-0

# 2. Delete the module branch
git branch -d module-0-setup
```

## 4. Environment Strategy

- `main`: Stable, production-ready code.
- `dev`: Active development branch where all modules are integrated together.
- `module-*`: Isolated feature branches for individual prompts.
