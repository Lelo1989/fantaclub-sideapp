import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { handleLogout } from '../../lib/logout.js';

describe('handleLogout', () => {
  it('signs out and redirects to /login', async () => {
    let replaced = '';
    let signOutCalled = false;
    const router = { replace: (url: string) => { replaced = url; } };
    const fakeSignOut = async () => { signOutCalled = true; };

    await handleLogout(router, fakeSignOut);

    assert.ok(signOutCalled);
    assert.equal(replaced, '/login');
  });
});
