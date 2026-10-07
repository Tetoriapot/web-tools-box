import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyText } from '../../src/lib/clipboard';
import { downloadText } from '../../src/lib/files';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

describe('clipboard', () => {
  it('writes exact Unicode text using the Clipboard API', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    await copyText('日本語 🧰');
    expect(writeText).toHaveBeenCalledWith('日本語 🧰');
  });
  it('falls back on denial, removes its temporary node and restores focus', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const exec = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', { value: exec, configurable: true });
    const button = document.createElement('button');
    document.body.append(button);
    button.focus();
    await copyText('fallback');
    expect(exec).toHaveBeenCalledWith('copy');
    expect(document.querySelector('textarea')).toBeNull();
    expect(document.activeElement).toBe(button);
  });
  it('reports failure without leaking a node or claiming success', async () => {
    vi.stubGlobal('navigator', {});
    Object.defineProperty(document, 'execCommand', {
      value: vi.fn().mockReturnValue(false),
      configurable: true,
    });
    await expect(copyText('hello')).rejects.toThrow('手動');
    expect(document.querySelector('textarea')).toBeNull();
    await expect(copyText('')).rejects.toThrow('ありません');
  });
});

describe('downloads', () => {
  it('creates a typed Blob and revokes its object URL after the click', () => {
    vi.useFakeTimers();
    const createObjectURL = vi.fn().mockReturnValue('blob:local-result');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    downloadText('body {}', 'style.css', 'text/css');
    expect(createObjectURL.mock.calls[0]?.[0]).toBeInstanceOf(Blob);
    expect((createObjectURL.mock.calls[0]?.[0] as Blob).type).toBe('text/css;charset=utf-8');
    expect(click).toHaveBeenCalledOnce();
    expect(document.querySelector('a')).toBeNull();
    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1500);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:local-result');
  });
  it('guards empty output and missing browser APIs', () => {
    expect(() => downloadText('', 'file.txt')).toThrow('ありません');
    vi.stubGlobal('URL', {});
    expect(() => downloadText('hello', 'file.txt')).toThrow('保存できません');
  });
});
