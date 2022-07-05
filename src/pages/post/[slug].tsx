import Head from 'next/head';
import { useRouter } from 'next/router';
import { GetStaticPaths, GetStaticProps } from 'next';

import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import { RichText } from 'prismic-dom';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

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
  // console.log(post);
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  const formatDate = format(
    new Date(post.first_publication_date),
    'dd MMM yyyy',
    { locale: ptBR }
  );

  const readingTime = post.data.content.reduce((acc, content) => {
    const wordsBody = RichText.asText(content.body).split(' ').length;
    const wordsHeading = content.heading.split(' ').length;

    const average = (acc += Math.ceil((wordsBody + wordsHeading) / 200));

    return average;
  }, 0);
  // console.log(readingTime);

  return (
    <>
      <Head>
        <title>Spacetraveling. | {post.data.title}</title>
      </Head>

      <Header />

      <main>
        <img
          src={post.data.banner.url}
          alt="banner"
          className={styles.banner}
        />
        <div
          className={`${styles.contentContainer} ${commonStyles.container} `}
        >
          <h1 className={styles.title}>{post.data.title}</h1>

          <div className={styles.info}>
            <span className={styles.calendar}>
              <FiCalendar size={20} className={styles.icon} />
              {formatDate}
            </span>
            <span className={styles.author}>
              <FiUser size={20} className={styles.icon} />
              {post.data.author}
            </span>
            <span className={styles.readingTime}>
              <FiClock size={20} className={styles.icon} />
              {`${readingTime} min`}
            </span>
          </div>

          <div className={styles.content}>
            {post.data.content.map(content => (
              <div key={content.heading}>
                <h2>{content.heading}</h2>
                <div
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(content.body),
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});

  const posts = await prismic.getByType('posts');

  const paths = posts.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params: { slug } }) => {
  const prismic = getPrismicClient({});
  const response = await prismic.getByUID('posts', `${slug}`);

  // console.log(response);
  // console.log(JSON.stringify(response, null, 2));

  interface postContent {
    heading: string;
    body: {
      text: string;
    }[];
  }
  [];

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: { url: response.data.banner.url },
      author: response.data.author,
      content: response.data.content.map((content: postContent) => ({
        heading: content.heading,
        body: [...content.body],
      })),
    },
  };

  return {
    props: { post },
    revalidate: 60,
  };
};
