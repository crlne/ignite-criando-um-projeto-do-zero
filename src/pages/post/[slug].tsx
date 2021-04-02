import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { getPrismicClient } from '../../services/prismic';

import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { useMemo } from 'react';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();
  
  const readingTime = useMemo(() => {
    const words = post?.data?.content?.reduce((accumulator, content) => {
      accumulator.push(...content.heading.split(' '))
      const body = RichText.asText(content.body).split(' ');
      accumulator.push(...body)
      return accumulator
    }, [])

    return Math.ceil(words?.length/200)
  },[post])

  console.log(readingTime);

  return (
    <>
      <Header />

      <div className={styles.container}>
        <img src={post?.data.banner.url} alt={post?.data.author} />

        <article className={commonStyles.container}>
          <header>
            <h1>{router.isFallback ? 'Carregando...' : post?.data.title}</h1>
            <div className={commonStyles.Infos}>
              <time>
                <FiCalendar />
                {format(new Date(post?.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                }) ?? 'Data de publicação'}
              </time>

              <span>
                <FiUser />
                {post?.data.author ?? 'Autor'}
              </span>

              <span>
                <FiClock /> {readingTime} min
              </span>
            </div>
          </header>

          <main>
            {post?.data?.content?.map(content => (
              <div key={content.heading}>
                <h2>{content.heading}</h2>
                <div
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(content.body),
                  }}
                />
              </div>
            ))}
          </main>
        </article>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ],{
      pageSize: 2,
    }
  );

  const paths = posts.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  return {
    fallback: true,
    paths,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

 console.log(JSON.stringify(response, null, 2));

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    },
  };

  return {
    props: {
      post,
    },
    redirect: 60 * 30,
  };
};