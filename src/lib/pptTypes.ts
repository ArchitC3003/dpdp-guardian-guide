export interface DomainScore {
  domain: string;
  name: string;
  items: number;
  yes: number;
  partial: number;
  no: number;
  na: number;
  score: number;
  penalty: string;
}
