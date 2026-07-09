export function firstRelation<T>(relation: T | T[] | null | undefined): T | undefined {
  return Array.isArray(relation) ? relation[0] : relation ?? undefined;
}
