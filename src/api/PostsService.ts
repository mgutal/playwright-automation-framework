import { ApiResponse, HttpUtils } from '../utils/httpUtils';

export interface Post {
  id?: number;
  userId: number;
  title: string;
  body: string;
}

/** API service object: keeps endpoints and payload shapes out of the specs. */
export class PostsService {
  private static readonly PATH = '/posts';

  constructor(private readonly http: HttpUtils) {}

  list(params?: Record<string, string | number>): Promise<ApiResponse<Post[]>> {
    return this.http.get<Post[]>(PostsService.PATH, { params });
  }

  getById(id: number): Promise<ApiResponse<Post>> {
    return this.http.get<Post>(`${PostsService.PATH}/${id}`);
  }

  create(post: Post): Promise<ApiResponse<Post>> {
    return this.http.post<Post>(PostsService.PATH, { body: post });
  }

  replace(id: number, post: Post): Promise<ApiResponse<Post>> {
    return this.http.put<Post>(`${PostsService.PATH}/${id}`, { body: post });
  }

  update(id: number, partial: Partial<Post>): Promise<ApiResponse<Post>> {
    return this.http.patch<Post>(`${PostsService.PATH}/${id}`, { body: partial });
  }

  remove(id: number): Promise<ApiResponse<unknown>> {
    return this.http.delete(`${PostsService.PATH}/${id}`);
  }
}
