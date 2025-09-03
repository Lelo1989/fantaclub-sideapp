export async function handleLogout(
  router: { replace: (url: string) => void },
  signOutFn: () => Promise<void>
) {
  await signOutFn();
  router.replace('/login');
}
