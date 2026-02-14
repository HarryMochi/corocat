
import MainLayout from "@/components/main-layout";
import Logo from "@/components/logo";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicyPage() {
  return (
    <MainLayout>
      <div className="flex flex-col min-h-screen">
        <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <Button asChild variant="outline">
            <Link href="/learn">Back to App</Link>
          </Button>
        </header>
        <main className="flex-1 py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <article className="prose dark:prose-invert max-w-none">
              <h1>Privacy Policy</h1>
              <p className="lead">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              
              <p>Your privacy is important to us. It is Corocat's policy to respect your privacy regarding any information we may collect from you across our website.</p>

              <h2>1. Information We Collect</h2>
              <p>We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.</p>
              <p>Information we collect includes:</p>
              <ul>
                <li><strong>Account Information:</strong> When you register for an account, we may ask for your email address and a password.</li>
                <li><strong>User-Generated Content:</strong> We collect the topics you enter to generate courses. This information is used solely to provide and improve the course generation feature.</li>
                <li><strong>Usage Data:</strong> We may collect information about how you use our service, such as which features you use and the courses you create.</li>
              </ul>
              
              <h2>2. How We Use Your Information</h2>
              <p>We use the information we collect in various ways, including to:</p>
              <ul>
                <li>Provide, operate, and maintain our website</li>
                <li>Improve, personalize, and expand our website</li>
                <li>Understand and analyze how you use our website</li>
                <li>Develop new products, services, features, and functionality</li>
                <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the website, and for marketing and promotional purposes</li>
                <li>Find and prevent fraud</li>
              </ul>

              <h2>3. Log Files</h2>
              <p>Corocat follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and a part of hosting services' analytics. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable. The purpose of the information is for analyzing trends, administering the site, tracking users' movement on the website, and gathering demographic information.</p>

              <h2>4. Security</h2>
              <p>The security of your Personal Information is important to us, but remember that no method of transmission over the Internet, or method of electronic storage, is 100% secure. While we strive to use commercially acceptable means to protect your Personal Information, we cannot guarantee its absolute security.</p>
              
              <h2>5. Links to Other Sites</h2>
              <p>Our Service may contain links to other sites that are not operated by us. If you click a third party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit. We have no control over and assume no responsibility for the content, privacy policies or practices of any third party sites or services.</p>
              
              <h2>Changes to This Privacy Policy</h2>
              <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.</p>
              
              <h2>Contact Us</h2>
              <p>If you have any questions about this Privacy Policy, please contact us.</p>
            </article>
          </div>
        </main>
      </div>
    </MainLayout>
  );
}
