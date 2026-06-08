export function sift4Distance(s1: string, s2: string, maxOffset = 5): number {
  if (!s1 || !s1.length) {
    return s2 ? s2.length : 0;
  }
  if (!s2 || !s2.length) {
    return s1.length;
  }

  const l1 = s1.length;
  const l2 = s2.length;

  let c1 = 0;
  let c2 = 0;
  let lcss = 0;
  let localCs = 0;
  let trans = 0;
  const offsetArr: { c1: number; c2: number; trans: boolean }[] = [];

  while (c1 < l1 && c2 < l2) {
    if (s1.charAt(c1) === s2.charAt(c2)) {
      localCs++;
      let isTrans = false;
      let i = 0;
      while (i < offsetArr.length) {
        const ofs = offsetArr[i]!;
        if (c1 <= ofs.c1 || c2 <= ofs.c2) {
          isTrans = Math.abs(c2 - c1) >= Math.abs(ofs.c2 - ofs.c1);
          if (isTrans) {
            trans++;
          } else if (!ofs.trans) {
            ofs.trans = true;
            trans++;
          }
          break;
        } else if (c1 > ofs.c2 && c2 > ofs.c1) {
          offsetArr.splice(i, 1);
        } else {
          i++;
        }
      }
      offsetArr.push({ c1, c2, trans: isTrans });
    } else {
      lcss += localCs;
      localCs = 0;
      if (c1 !== c2) {
        c1 = c2 = Math.min(c1, c2);
      }
      for (let j = 0; j < maxOffset && (c1 + j < l1 || c2 + j < l2); j++) {
        if (c1 + j < l1 && s1.charAt(c1 + j) === s2.charAt(c2)) {
          c1 += j - 1;
          c2--;
          break;
        }
        if (c2 + j < l2 && s1.charAt(c1) === s2.charAt(c2 + j)) {
          c1--;
          c2 += j - 1;
          break;
        }
      }
    }
    c1++;
    c2++;
    if (c1 >= l1 || c2 >= l2) {
      lcss += localCs;
      localCs = 0;
      c1 = c2 = Math.min(c1, c2);
    }
  }
  lcss += localCs;
  return Math.round(Math.max(l1, l2) - lcss + trans);
}
