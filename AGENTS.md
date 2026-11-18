<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep dashboard motivational copy and its audience selector in `src/lib/motivation.ts`; use the loaded profile's period without a fallback so unresolved profiles never receive cohort-specific messages.
- Test audience-selection rules with `bun test` beside the motivation module so cohort targeting stays independent of presentation.
- Render dashboard motivation in `MotivationBanner` with themed celebration tokens and reduced-motion support so decoration stays separate from audience rules.
