import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { GetStaticProps } from 'next';

import { getPrismicClient } from '../services/prismic';

import styles from './home.module.scss';
import commonStyles from '../styles/common.module.scss';

import { FiCalendar, FiUser } from 'react-icons/fi';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

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
  const postsFormatDate = postsPagination.results.map((post: Post) => ({
    ...post,
    first_publication_date: format(
      new Date(post.first_publication_date),
      'dd MMM yyyy',
      { locale: ptBR }
    ),
  }));
  // console.log(postsFormatDate);

  const [posts, setPosts] = useState(postsFormatDate);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  const loadMorePosts = async () => {
    const response = await fetch(nextPage);
    const data = await response.json();
    // console.log(data);

    const newPosts = data.results.map((post: Post) => ({
      uid: post.uid,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        { locale: ptBR }
      ),
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    }));

    setNextPage(data.next_page);
    setPosts([...posts, ...newPosts]);
  };

  return (
    <>
      <Head>
        <title>Home | spacetraveling.</title>
      </Head>

      <main className={`${styles.mainContainer} ${commonStyles.container}`}>
        <span className={styles.logo}>
          <Link href={'/'}>
            <a>
              <img src={'/logo.svg'} alt="logo" />
            </a>
          </Link>
        </span>

        {posts?.map((post: Post) => (
          <div className={styles.content} key={post.uid}>
            <Link href={`/post/${post.uid}`}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div className={styles.infoContainer}>
                  <span>
                    <FiCalendar size={20} className={styles.icon} />{' '}
                    {post.first_publication_date}
                  </span>
                  <span>
                    <FiUser size={20} className={styles.icon} />{' '}
                    {post.data.author}
                  </span>
                </div>
              </a>
            </Link>
          </div>
        ))}

        {nextPage && (
          <button className={styles.btnCarregar} onClick={loadMorePosts}>
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});

  const postsResponse = await prismic.getByType('posts', {
    pageSize: 2,
    orderings: {
      field: 'document.first_publication_date',
      direction: 'desc',
    },
  });
  // console.log(postsResponse);
  // console.log(JSON.stringify(postsResponse, null, 2));

  const posts = postsResponse.results.map(post => ({
    uid: post.uid,
    first_publication_date: post.first_publication_date,
    data: {
      title: post.data.title,
      subtitle: post.data.subtitle,
      author: post.data.author,
    },
  }));
  // console.log(posts);

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
    },
    revalidate: 60,
  };
};
