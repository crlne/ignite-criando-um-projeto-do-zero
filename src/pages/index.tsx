import { useState } from 'react';

import { GetStaticProps } from 'next';
import Link from 'next/link';

import { FiCalendar, FiUser } from 'react-icons/fi';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import Prismic from '@prismicio/client';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState(postsPagination.results);
  const [postsNextPage, setPostsNextPage] = useState(postsPagination.next_page);

  async function getMorePosts(): Promise<void> {
    const postsResponse = await fetch(
      postsPagination.next_page
    ).then(response => response.json());

    const morePosts = postsResponse.results.map((post: Post) => ({
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    }));

    setPosts([...posts, ...morePosts]);
    setPostsNextPage(postsResponse.next_page);
  }

  return (
    <div className={`${commonStyles.container} ${styles.container}`}>
      <img src="/images/Logo.svg" alt="logo" />

      <ul className={styles.posts}>
        {posts.map(post => (
          <li key={post.uid} className={styles.post}>
            <Link href={`/post/${post.uid}`}>
              <a>
                <h3>{post.data.title}</h3>
                <p>{post.data.subtitle}</p>

                <div className={commonStyles.Infos}>
                  <time>
                    <FiCalendar />
                    {format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy',
                      { locale: ptBR }
                    )}
                  </time>
                  <span>
                    <FiUser />
                    {post.data.author}
                  </span>
                </div>
              </a>
            </Link>
          </li>
        ))}
      </ul>

      { postsPagination.next_page && (
        <button type="button" onClick={getMorePosts}>Carregar mais posts</button>
      ) }

      
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 2
    } 
  );

  const next_page = postsResponse.next_page

  const results = postsResponse.results.map((post: Post) => ({
    uid: post.uid,
    first_publication_date: post.first_publication_date,
    data: {
      title: post.data.title,
      subtitle: post.data.subtitle,
      author: post.data.author,
    },
  }));

  console.log(results);

  return {
    props: {
      postsPagination: {
        next_page,
        results
      },
    },
  };
};