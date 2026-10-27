// FAQ content: six sections, every number and claim already verified
// in the public record. Nothing here promises a flow that is not
// working; Muralith points at the direct Highlight mint link, which is
// the working path while in-tab sign-in is parked.
export interface FaqItem {
  q: string
  a: string
}

export interface FaqSection {
  title: string
  items: FaqItem[]
}

export const FAQ_SECTIONS: FaqSection[] = [
  {
    title: 'Getting started',
    items: [
      {
        q: 'What is Ohnahji?',
        a: 'Ohnahji is Web3\u2019s first HBCU: a daily stream, a learning community, and an NFT collection built around emerging technology and creator business. The rule of the room is each one teach one.',
      },
      {
        q: 'How do I watch the stream?',
        a: 'Live on Twitch at twitch.tv/ohnahji and on Kick at kick.com/ohnahji. Recaps and clips live on YouTube at youtube.com/@ohnahji.',
      },
      {
        q: 'Do I need a wallet to follow along?',
        a: 'No. Watching, reading the Quotes Board, and following on socials are all free. A wallet only matters for minting, voting, and the holder-only areas.',
      },
    ],
  },
  {
    title: 'Minting',
    items: [
      {
        q: 'How much does an Ohnahji OG cost to mint?',
        a: '0.005 ETH, plus gas. The collection is capped at 9,010, with 5,097 minted so far.',
      },
      {
        q: 'Where can I mint or buy?',
        a: 'From the Mint tab on this site, or on the secondary market through the OpenSea collection linked on the Socials tab.',
      },
      {
        q: 'How do I know a link is real?',
        a: 'The only contract address is shown on the Mint tab as a copyable chip, and the real site never asks for a seed phrase. Any page asking for one is not us.',
      },
    ],
  },
  {
    title: 'Holders',
    items: [
      {
        q: 'What does holding an OG unlock?',
        a: 'Three areas on this site: the Vault, a Grove-powered file locker; First Look, early access to the Alphites stadium and the new campus; and early access to the Exchangent.',
      },
      {
        q: 'How is holding checked?',
        a: 'Connect a wallet holding at least one OG. The check reads your balance onchain, and nothing about your wallet is stored beyond your session.',
      },
      {
        q: 'I hold, but the gated tabs are not showing. What do I do?',
        a: 'Reconnect your wallet and give the balance check a few seconds. The gated tabs appear once the holder check passes.',
      },
    ],
  },
  {
    title: 'Stream',
    items: [
      {
        q: 'When does the stream run?',
        a: 'Daily. Day numbers count from the first stream, and the daily show is the heartbeat of the project.',
      },
      {
        q: 'Where do I find past streams?',
        a: 'Full broadcasts and clips live on the Live tab, and recaps go up on YouTube.',
      },
      {
        q: 'What is the Quotes Board?',
        a: 'Each day\u2019s standout lines, picked from the stream transcript and ranked by the community. Reading is free; voting takes any connected wallet.',
      },
    ],
  },
  {
    title: 'Muralith',
    items: [
      {
        q: 'What is Muralith?',
        a: 'Muralith is a generative art series cut from the stream, minted on Highlight. Each cut is sealed by its mint hash and ranked on a true percentile scale.',
      },
      {
        q: 'How much does a Muralith mint cost?',
        a: '0.0018 ETH in total: 0.001 ETH plus a 0.0008 ETH Highlight fee, before gas.',
      },
      {
        q: 'How do I mint one?',
        a: 'Open the Muralith tab and follow the link to mint directly on Highlight.',
      },
    ],
  },
  {
    title: 'New Eden',
    items: [
      {
        q: 'What is the Exchangent?',
        a: 'The Exchangent is Ohnahji\u2019s marketplace in New Eden, an onchain agent world, at plot (1,0). It is where agent-made creations are listed and collected.',
      },
      {
        q: 'What else is on the square?',
        a: 'The Gallery at (1,-1), the Welcome House at (2,0), and the Archive at (2,-1).',
      },
      {
        q: 'Can I visit it without holding?',
        a: 'The New Eden square is open onchain. The early-access Exchangent tab on this site is for OG holders.',
      },
    ],
  },
]
