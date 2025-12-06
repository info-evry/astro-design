/**
 * Social Icons Tests
 * Tests for social media icon SVG paths and helper functions
 */

import { describe, test, expect } from 'vitest';
import { socialIcons, buildSocialLinks, type SocialIconName } from '../src/icons/social';

describe('socialIcons', () => {
  test('should contain common social media icons', () => {
    expect(socialIcons.discord).toBeDefined();
    expect(socialIcons.telegram).toBeDefined();
    expect(socialIcons.instagram).toBeDefined();
    expect(socialIcons.github).toBeDefined();
    expect(socialIcons.linkedin).toBeDefined();
    expect(socialIcons.twitter).toBeDefined();
    expect(socialIcons.youtube).toBeDefined();
    expect(socialIcons.facebook).toBeDefined();
  });

  test('each icon should be a valid SVG path string', () => {
    for (const [name, path] of Object.entries(socialIcons)) {
      expect(typeof path).toBe('string');
      expect(path.length).toBeGreaterThan(0);
      expect(path).toContain('<path');
      expect(path).toContain('fill="currentColor"');
      expect(path).toContain('d="');
    }
  });

  test('icons should contain path data', () => {
    for (const [name, path] of Object.entries(socialIcons)) {
      // Path data should have coordinates (numbers)
      expect(path).toMatch(/d="[A-Za-z0-9.\s-]+"/);
    }
  });
});

describe('buildSocialLinks', () => {
  const mockSocial: Record<string, { url: string }> = {
    discord: { url: 'https://discord.gg/test' },
    telegram: { url: 'https://t.me/test' },
    instagram: { url: 'https://instagram.com/test' },
    github: { url: 'https://github.com/test' },
    linkedin: { url: 'https://linkedin.com/in/test' },
  };

  test('should build links from social object', () => {
    const links = buildSocialLinks(mockSocial);
    expect(links.length).toBeGreaterThan(0);
  });

  test('should use default icons if none specified', () => {
    const links = buildSocialLinks(mockSocial);
    // Default icons: discord, telegram, instagram, github
    expect(links).toHaveLength(4);
  });

  test('should filter to only requested icons', () => {
    const links = buildSocialLinks(mockSocial, ['discord', 'github']);
    expect(links).toHaveLength(2);
    expect(links[0].name).toBe('Discord');
    expect(links[1].name).toBe('Github');
  });

  test('should capitalize icon names', () => {
    const links = buildSocialLinks(mockSocial, ['discord']);
    expect(links[0].name).toBe('Discord');
  });

  test('should include href from social object', () => {
    const links = buildSocialLinks(mockSocial, ['discord']);
    expect(links[0].href).toBe('https://discord.gg/test');
  });

  test('should include icon SVG path', () => {
    const links = buildSocialLinks(mockSocial, ['discord']);
    expect(links[0].icon).toBe(socialIcons.discord);
    expect(links[0].icon).toContain('<path');
  });

  test('should skip icons without URLs', () => {
    const partialSocial = {
      discord: { url: 'https://discord.gg/test' },
      telegram: { url: '' },
      instagram: { url: 'https://instagram.com/test' },
    };
    const links = buildSocialLinks(partialSocial, ['discord', 'telegram', 'instagram']);
    expect(links).toHaveLength(2);
    expect(links.map(l => l.name)).toEqual(['Discord', 'Instagram']);
  });

  test('should handle empty social object', () => {
    const links = buildSocialLinks({});
    expect(links).toHaveLength(0);
  });

  test('should handle missing icons in social object', () => {
    const sparseSocial = {
      discord: { url: 'https://discord.gg/test' },
    };
    const links = buildSocialLinks(sparseSocial, ['discord', 'github', 'twitter']);
    expect(links).toHaveLength(1);
    expect(links[0].name).toBe('Discord');
  });

  test('should work with all icon types', () => {
    const fullSocial: Record<string, { url: string }> = {
      discord: { url: 'https://discord.gg/test' },
      telegram: { url: 'https://t.me/test' },
      instagram: { url: 'https://instagram.com/test' },
      github: { url: 'https://github.com/test' },
      linkedin: { url: 'https://linkedin.com/test' },
      twitter: { url: 'https://twitter.com/test' },
      youtube: { url: 'https://youtube.com/test' },
      facebook: { url: 'https://facebook.com/test' },
    };
    const allIcons: SocialIconName[] = ['discord', 'telegram', 'instagram', 'github', 'linkedin', 'twitter', 'youtube', 'facebook'];
    const links = buildSocialLinks(fullSocial, allIcons);
    expect(links).toHaveLength(8);
  });

  test('should preserve order of requested icons', () => {
    const links = buildSocialLinks(mockSocial, ['github', 'discord', 'instagram']);
    expect(links[0].name).toBe('Github');
    expect(links[1].name).toBe('Discord');
    expect(links[2].name).toBe('Instagram');
  });
});
