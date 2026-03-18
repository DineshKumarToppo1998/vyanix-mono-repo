import { QueryClient } from '@tanstack/react-query';

export function getQueryClient() {
  return new QueryClient();
}

export function serverQueryClient() {
  return new QueryClient();
}
