export interface SlashCommandInfo {
  command: string;
  syntax: string;
  description: string;
  icon: string;
}

export const SLASH_COMMANDS_CATALOG: SlashCommandInfo[] = [
  { command: '/poll', syntax: '/poll "Question" "Option A" "Option B"', description: 'Create an interactive chat poll', icon: '📊' },
  { command: '/8ball', syntax: '/8ball "Will we finish playlist?"', description: 'Ask Magic 8-Ball a fortune question', icon: '🎱' },
  { command: '/dice', syntax: '/dice', description: 'Roll a random 6-sided die', icon: '🎲' },
  { command: '/coin', syntax: '/coin', description: 'Flip a coin (Heads or Tails)', icon: '🪙' },
  { command: '/shrug', syntax: '/shrug', description: 'Append ¯\\_(ツ)_/¯', icon: '¯\\_(ツ)_/¯' },
  { command: '/tableflip', syntax: '/tableflip', description: 'Append (╯°□°）╯︵ ┻━┻', icon: '(╯°□°）╯' },
  { command: '/unflip', syntax: '/unflip', description: 'Append ┬─┬ノ( º _ ºノ)', icon: '┬─┬' },
];

export const CATEGORIZED_EMOJIS: Record<string, string[]> = {
  '🎉 Party & Vibe': ['🔥', '💃', '🎵', '🎉', '🚀', '💯', '✨', '🙌', '🎶', '🥳', '🍸', '🎧'],
  '😃 Smileys': ['😂', '😍', '😎', '🤩', '🥳', '🙃', '😇', '🤔', '😴', '😮', '🤯', '😜'],
  '❤️ Love & Support': ['❤️', '💖', '💙', '💜', '🤍', '💪', '🙏', '👏', '🤝', '👑', '⭐', '🌟'],
  '🍕 Food & Drinks': ['☕', '🍺', '🍷', '🍕', '🍔', '🍿', '🍩', '🧋', '🍉', '🎂', '🍻', '🌮'],
};

export const PRESET_STICKERS = [
  { name: 'Party Vibe', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=60' },
  { name: 'Chill Beats', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=60' },
  { name: 'Neon Lights', url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=60' },
  { name: 'Lofi Coffee', url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&auto=format&fit=crop&q=60' },
];

export const PRESET_GIFS = [
  { name: 'Dance Party', url: 'https://media.giphy.com/media/l3q2t2KAyv88ab8hG/giphy.gif' },
  { name: 'Vibe Cat', url: 'https://media.giphy.com/media/jpbnoe3UIa8TU8LM13/giphy.gif' },
  { name: 'Lofi Chill', url: 'https://media.giphy.com/media/13l7w7N4Vr1fh6/giphy.gif' },
  { name: 'Hype Popcorn', url: 'https://media.giphy.com/media/gl0mkIZOW6Nwc/giphy.gif' },
  { name: 'DJ Beat', url: 'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif' },
  { name: 'Mind Blown', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif' },
];
