import { preview } from '../src/index.ts';

// 「｜」= BudouX が「ここで折り返してよい」と判断した位置。
// 従来の @vercel/og などは文字単位で割るので、下記の｜を無視して
// 「東」と「京」の間などで無理やり改行してしまう。orogami はそれを防ぐ。
const titles = [
  '個人開発したツールが海外の開発者にも届くための日本語OGP設計',
  'BudouXでOGP画像のタイトルをいい感じに折り返す',
  '東京都渋谷区のスタートアップで働くエンジニアの一日',
];

for (const t of titles) {
  console.log('入力  :', t);
  console.log('折返し:', preview(t));
  console.log('');
}
